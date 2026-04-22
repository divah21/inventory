'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, TEXT, DECIMAL, DATEONLY, BOOLEAN, ENUM, DATE } = Sequelize;
    const now = { type: DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') };

    await queryInterface.createTable('items', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: STRING(64), allowNull: false, unique: true },
      description: { type: TEXT, allowNull: false },
      unit: { type: STRING(32), allowNull: false, defaultValue: 'pcs' },
      category: { type: STRING(128) },
      reorder_level: { type: DECIMAL(14, 3), defaultValue: 0 },
      unit_price: { type: DECIMAL(14, 2) },
      currency: { type: STRING(8), defaultValue: 'UGX' },
      is_active: { type: BOOLEAN, defaultValue: true },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('items', ['description']);

    await queryInterface.createTable('warehouses', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: STRING(128), allowNull: false, unique: true },
      code: { type: STRING(64) },
      location: { type: STRING(255) },
      is_active: { type: BOOLEAN, defaultValue: true },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.createTable('suppliers', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: STRING(255), allowNull: false, unique: true },
      contact_person: { type: STRING(128) },
      phone: { type: STRING(64) },
      email: { type: STRING(128) },
      address: { type: TEXT },
      is_active: { type: BOOLEAN, defaultValue: true },
      created_at: now,
      updated_at: now,
    });

    await queryInterface.createTable('projects', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: STRING(255), allowNull: false, unique: true },
      client: { type: STRING(255) },
      site_location: { type: STRING(255) },
      start_date: { type: DATEONLY },
      end_date: { type: DATEONLY },
      status: { type: ENUM('active', 'on_hold', 'completed', 'cancelled'), defaultValue: 'active' },
      created_at: now,
      updated_at: now,
    });

    const fk = (table, column, refTable, onDelete = 'RESTRICT') => ({
      type: INTEGER,
      references: { model: refTable, key: 'id' },
      onUpdate: 'CASCADE',
      onDelete,
    });

    await queryInterface.createTable('opening_stock', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { ...fk('opening_stock', 'item_id', 'items'), allowNull: false },
      warehouse_id: { ...fk('opening_stock', 'warehouse_id', 'warehouses'), allowNull: false },
      supplier_id: fk('opening_stock', 'supplier_id', 'suppliers', 'SET NULL'),
      quantity: { type: DECIMAL(14, 3), allowNull: false },
      unit: { type: STRING(32) },
      transaction_date: { type: DATEONLY, allowNull: false },
      notes: { type: TEXT },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('opening_stock', ['item_id']);
    await queryInterface.addIndex('opening_stock', ['warehouse_id']);
    await queryInterface.addIndex('opening_stock', ['transaction_date']);

    await queryInterface.createTable('stock_receipts', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { ...fk('stock_receipts', 'item_id', 'items'), allowNull: false },
      warehouse_id: { ...fk('stock_receipts', 'warehouse_id', 'warehouses'), allowNull: false },
      supplier_id: fk('stock_receipts', 'supplier_id', 'suppliers', 'SET NULL'),
      quantity: { type: DECIMAL(14, 3), allowNull: false },
      unit: { type: STRING(32) },
      invoice_no: { type: STRING(64) },
      unit_price: { type: DECIMAL(14, 2) },
      currency: { type: STRING(8), defaultValue: 'UGX' },
      transaction_date: { type: DATEONLY, allowNull: false },
      notes: { type: TEXT },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('stock_receipts', ['item_id']);
    await queryInterface.addIndex('stock_receipts', ['warehouse_id']);
    await queryInterface.addIndex('stock_receipts', ['supplier_id']);
    await queryInterface.addIndex('stock_receipts', ['transaction_date']);
    await queryInterface.addIndex('stock_receipts', ['invoice_no']);

    await queryInterface.createTable('issued_materials', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { ...fk('issued_materials', 'item_id', 'items'), allowNull: false },
      warehouse_id: { ...fk('issued_materials', 'warehouse_id', 'warehouses'), allowNull: false },
      project_id: { ...fk('issued_materials', 'project_id', 'projects'), allowNull: false },
      quantity: { type: DECIMAL(14, 3), allowNull: false },
      unit: { type: STRING(32) },
      issued_to: { type: STRING(255) },
      transaction_date: { type: DATEONLY, allowNull: false },
      week_ending: { type: DATEONLY },
      notes: { type: TEXT },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('issued_materials', ['item_id']);
    await queryInterface.addIndex('issued_materials', ['warehouse_id']);
    await queryInterface.addIndex('issued_materials', ['project_id']);
    await queryInterface.addIndex('issued_materials', ['transaction_date']);
    await queryInterface.addIndex('issued_materials', ['week_ending']);

    await queryInterface.createTable('stock_transfers', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { ...fk('stock_transfers', 'item_id', 'items'), allowNull: false },
      from_warehouse_id: {
        ...fk('stock_transfers', 'from_warehouse_id', 'warehouses'),
        allowNull: false,
      },
      to_warehouse_id: {
        ...fk('stock_transfers', 'to_warehouse_id', 'warehouses'),
        allowNull: false,
      },
      quantity: { type: DECIMAL(14, 3), allowNull: false },
      unit: { type: STRING(32) },
      transaction_date: { type: DATEONLY, allowNull: false },
      reference_no: { type: STRING(64) },
      notes: { type: TEXT },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('stock_transfers', ['item_id']);
    await queryInterface.addIndex('stock_transfers', ['from_warehouse_id']);
    await queryInterface.addIndex('stock_transfers', ['to_warehouse_id']);
    await queryInterface.addIndex('stock_transfers', ['transaction_date']);

    await queryInterface.createTable('stock_adjustments', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { ...fk('stock_adjustments', 'item_id', 'items'), allowNull: false },
      warehouse_id: { ...fk('stock_adjustments', 'warehouse_id', 'warehouses'), allowNull: false },
      quantity_delta: { type: DECIMAL(14, 3), allowNull: false },
      reason: { type: STRING(255), allowNull: false },
      transaction_date: { type: DATEONLY, allowNull: false },
      notes: { type: TEXT },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('stock_adjustments', ['item_id']);
    await queryInterface.addIndex('stock_adjustments', ['warehouse_id']);
    await queryInterface.addIndex('stock_adjustments', ['transaction_date']);

    await queryInterface.createTable('price_list_entries', {
      id: { type: INTEGER, autoIncrement: true, primaryKey: true },
      material_code: { type: STRING(64), allowNull: false },
      description: { type: TEXT },
      amount: { type: DECIMAL(14, 2) },
      currency: { type: STRING(8), defaultValue: 'EUR' },
      effective_date: { type: DATEONLY },
      created_at: now,
      updated_at: now,
    });
    await queryInterface.addIndex('price_list_entries', ['material_code']);
  },

  async down(queryInterface) {
    const tables = [
      'stock_adjustments',
      'stock_transfers',
      'issued_materials',
      'stock_receipts',
      'opening_stock',
      'price_list_entries',
      'projects',
      'suppliers',
      'warehouses',
      'items',
    ];
    for (const t of tables) await queryInterface.dropTable(t);
  },
};
