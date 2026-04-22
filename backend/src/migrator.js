/**
 * Umzug-based migration runner.
 *
 * Programmatic use:
 *   const { migrate } = require('./migrator');
 *   await migrate(); // runs any pending migrations
 *
 * CLI:
 *   node src/migrator.js up       # run all pending
 *   node src/migrator.js down     # roll back most recent
 *   node src/migrator.js status   # show executed + pending
 *   node src/migrator.js up --to 20260421000000-foo.js
 *   node src/migrator.js down --to 0      # roll back everything
 */

const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize, Sequelize } = require('./models');

// glob requires forward slashes even on Windows, so normalize the absolute path.
const migrationsGlob = path
  .join(__dirname, '..', 'migrations', '*.js')
  .replace(/\\/g, '/');

const umzug = new Umzug({
  migrations: {
    glob: migrationsGlob,
    // Migrations written in sequelize-cli style export { up, down }
    // that expect (queryInterface, Sequelize). Wrap them so Umzug passes those.
    resolve: ({ name, path: filePath, context }) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const migration = require(filePath);
      return {
        name,
        up: async () => migration.up(context.queryInterface, context.Sequelize),
        down: async () => migration.down(context.queryInterface, context.Sequelize),
      };
    },
  },
  context: { queryInterface: sequelize.getQueryInterface(), Sequelize },
  storage: new SequelizeStorage({
    sequelize,
    // Use the same table name sequelize-cli uses so the two systems interop
    // (the init migration recorded by sequelize-cli will not be re-run).
    tableName: 'SequelizeMeta',
  }),
  logger: {
    info: (msg) => console.log('[migrate]', typeof msg === 'string' ? msg : msg.event || msg),
    warn: (msg) => console.warn('[migrate]', msg),
    error: (msg) => console.error('[migrate]', msg),
    debug: () => {},
  },
});

/** Run all pending migrations. Returns the list of executed migration names. */
async function migrate() {
  const pending = await umzug.pending();
  if (pending.length === 0) {
    console.log('[migrate] database is up to date');
    return [];
  }
  console.log(`[migrate] running ${pending.length} migration(s): ${pending.map((m) => m.name).join(', ')}`);
  const executed = await umzug.up();
  console.log(`[migrate] applied ${executed.length} migration(s)`);
  return executed.map((m) => m.name);
}

async function rollback(opts = {}) {
  return umzug.down(opts);
}

async function status() {
  const executed = await umzug.executed();
  const pending = await umzug.pending();
  return { executed: executed.map((m) => m.name), pending: pending.map((m) => m.name) };
}

module.exports = { umzug, migrate, rollback, status };

// CLI entry
if (require.main === module) {
  const [, , cmdRaw, ...rest] = process.argv;
  const cmd = (cmdRaw || 'up').toLowerCase();

  // Parse --to <value>
  const toIdx = rest.indexOf('--to');
  const to = toIdx !== -1 ? rest[toIdx + 1] : undefined;

  (async () => {
    try {
      if (cmd === 'up') {
        if (to !== undefined) await umzug.up({ to });
        else await migrate();
      } else if (cmd === 'down') {
        if (to === '0') await umzug.down({ to: 0 });
        else if (to !== undefined) await umzug.down({ to });
        else await umzug.down(); // most-recent only
      } else if (cmd === 'status') {
        const { executed, pending } = await status();
        console.log('Executed:');
        executed.forEach((n) => console.log('  ✓', n));
        console.log('Pending:');
        pending.forEach((n) => console.log('  •', n));
        if (pending.length === 0) console.log('  (none)');
      } else {
        console.error(`Unknown command: ${cmd}. Use: up | down | status`);
        process.exit(2);
      }
      await sequelize.close();
    } catch (err) {
      console.error('[migrate] failed:', err);
      process.exit(1);
    }
  })();
}
