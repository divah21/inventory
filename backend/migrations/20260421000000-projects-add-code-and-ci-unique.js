'use strict';

const { QueryTypes } = require('sequelize');

/**
 * Adds `projects.code` (nullable, unique when set) and replaces the
 * case-sensitive unique on `name` with a case-insensitive functional unique
 * on LOWER(TRIM(name)).
 *
 * Safe to re-run: every structural step uses IF [NOT] EXISTS. Before creating
 * the functional unique, the migration dedupes projects whose names differ
 * only in casing/whitespace by repointing issued_materials.project_id to the
 * lowest-id survivor in each group, then deleting the loser rows.
 *
 * Postgres-only (uses LOWER/TRIM expressions).
 */
module.exports = {
  async up(queryInterface) {
    const sql = queryInterface.sequelize;

    await sql.transaction(async (t) => {
      // 1. Add `code` column (idempotent).
      await sql.query(
        `ALTER TABLE projects ADD COLUMN IF NOT EXISTS code VARCHAR(64);`,
        { transaction: t }
      );

      // 2. Partial unique on code — ignores NULLs, so legacy rows don't conflict.
      await sql.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS projects_code_unique
           ON projects (code)
           WHERE code IS NOT NULL;`,
        { transaction: t }
      );

      // 3. Drop the case-sensitive unique on name (if still there from init).
      await sql.query(
        `ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_name_key;`,
        { transaction: t }
      );

      // 4. Dedupe rows whose names collapse to the same normalized form.
      //    Keep the lowest-id row per group, repoint issuances, delete losers.
      const groups = await sql.query(
        `SELECT LOWER(TRIM(name)) AS norm,
                MIN(id)          AS survivor,
                ARRAY_AGG(id ORDER BY id) AS ids
         FROM projects
         GROUP BY LOWER(TRIM(name))
         HAVING COUNT(*) > 1;`,
        { transaction: t, type: QueryTypes.SELECT }
      );

      for (const g of groups) {
        const survivor = Number(g.survivor);
        const losers = (g.ids || [])
          .map(Number)
          .filter((id) => id !== survivor);
        if (losers.length === 0) continue;
        console.log(
          `[migrate] merging projects with normalized name '${g.norm}': keeping id=${survivor}, removing ids=[${losers.join(',')}]`
        );
        await sql.query(
          `UPDATE issued_materials
             SET project_id = :survivor
             WHERE project_id IN (:losers);`,
          { transaction: t, replacements: { survivor, losers } }
        );
        await sql.query(
          `DELETE FROM projects WHERE id IN (:losers);`,
          { transaction: t, replacements: { losers } }
        );
      }

      // 5. Trim stray whitespace on remaining rows so future inserts compare cleanly.
      await sql.query(
        `UPDATE projects SET name = TRIM(name) WHERE name <> TRIM(name);`,
        { transaction: t }
      );

      // 6. Finally, the functional unique index.
      await sql.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS projects_name_lower_unique
           ON projects (LOWER(TRIM(name)));`,
        { transaction: t }
      );
    });
  },

  async down(queryInterface) {
    const sql = queryInterface.sequelize;
    await sql.query('DROP INDEX IF EXISTS projects_name_lower_unique;');
    await sql.query('DROP INDEX IF EXISTS projects_code_unique;');
    await sql.query('ALTER TABLE projects DROP COLUMN IF EXISTS code;');
    await sql.query(
      'ALTER TABLE projects ADD CONSTRAINT projects_name_key UNIQUE (name);'
    );
  },
};
