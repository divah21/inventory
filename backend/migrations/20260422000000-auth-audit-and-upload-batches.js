'use strict';

/**
 * Adds users, audit_logs, upload_batches, and upload_batch_id columns
 * on transactional tables so each imported row can be tied back to the
 * batch that created it (for selective revert).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, TEXT, ENUM, JSONB, DATE, BOOLEAN } = Sequelize;
    const now = { type: DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') };

    // --- users ---------------------------------------------------------
    await queryInterface.createTable('users', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: STRING(255), allowNull: false, unique: true },
      name: { type: STRING(255), allowNull: false },
      password_hash: { type: STRING(255), allowNull: false },
      role: { type: ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
      is_active: { type: BOOLEAN, allowNull: false, defaultValue: true },
      last_login_at: { type: DATE },
      created_at: now,
      updated_at: now,
    });
    // Case-insensitive lookup on email
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email));'
    );

    // --- audit_logs ----------------------------------------------------
    await queryInterface.createTable('audit_logs', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      user_email: { type: STRING(255) },
      user_role: { type: STRING(32) },
      method: { type: STRING(16), allowNull: false },
      path: { type: STRING(512), allowNull: false },
      resource: { type: STRING(64) },
      resource_id: { type: STRING(64) },
      status_code: { type: INTEGER },
      ip: { type: STRING(64) },
      user_agent: { type: STRING(512) },
      payload: { type: JSONB },
      created_at: now,
    });
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('audit_logs', ['resource']);

    // --- upload_batches ------------------------------------------------
    await queryInterface.createTable('upload_batches', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      filename: { type: STRING(255) },
      size_bytes: { type: INTEGER },
      file_hash: { type: STRING(128) },
      summary: { type: JSONB },
      status: {
        type: ENUM('completed', 'reverted', 'failed'),
        allowNull: false,
        defaultValue: 'completed',
      },
      reverted_at: { type: DATE },
      reverted_by: {
        type: INTEGER,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('upload_batches', ['user_id']);
    await queryInterface.addIndex('upload_batches', ['file_hash']);
    await queryInterface.addIndex('upload_batches', ['status']);

    // --- add upload_batch_id to transactional tables -------------------
    const fkBatch = (tbl) => ({
      type: INTEGER,
      references: { model: 'upload_batches', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addColumn('opening_stock', 'upload_batch_id', fkBatch('opening_stock'));
    await queryInterface.addColumn('stock_receipts', 'upload_batch_id', fkBatch('stock_receipts'));
    await queryInterface.addColumn('issued_materials', 'upload_batch_id', fkBatch('issued_materials'));
    await queryInterface.addColumn('price_list_entries', 'upload_batch_id', fkBatch('price_list_entries'));
    await queryInterface.addIndex('opening_stock', ['upload_batch_id']);
    await queryInterface.addIndex('stock_receipts', ['upload_batch_id']);
    await queryInterface.addIndex('issued_materials', ['upload_batch_id']);
    await queryInterface.addIndex('price_list_entries', ['upload_batch_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('price_list_entries', 'upload_batch_id');
    await queryInterface.removeColumn('issued_materials', 'upload_batch_id');
    await queryInterface.removeColumn('stock_receipts', 'upload_batch_id');
    await queryInterface.removeColumn('opening_stock', 'upload_batch_id');
    await queryInterface.dropTable('upload_batches');
    // Drop the ENUM created for upload_batches.status
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_upload_batches_status";');

    await queryInterface.dropTable('audit_logs');

    await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_email_lower_unique;');
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};
