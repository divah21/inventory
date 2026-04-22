module.exports = (sequelize, DataTypes) => {
  const StockReceipt = sequelize.define(
    'StockReceipt',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      supplier_id: { type: DataTypes.INTEGER },
      quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
      unit: { type: DataTypes.STRING(32) },
      invoice_no: { type: DataTypes.STRING(64) },
      unit_price: { type: DataTypes.DECIMAL(14, 2) },
      currency: { type: DataTypes.STRING(8), defaultValue: 'UGX' },
      transaction_date: { type: DataTypes.DATEONLY, allowNull: false },
      notes: { type: DataTypes.TEXT },
      upload_batch_id: { type: DataTypes.INTEGER },
    },
    {
      tableName: 'stock_receipts',
      indexes: [
        { fields: ['item_id'] },
        { fields: ['warehouse_id'] },
        { fields: ['supplier_id'] },
        { fields: ['transaction_date'] },
        { fields: ['invoice_no'] },
      ],
    }
  );

  StockReceipt.associate = (m) => {
    StockReceipt.belongsTo(m.Item, { foreignKey: 'item_id', as: 'item' });
    StockReceipt.belongsTo(m.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    StockReceipt.belongsTo(m.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  };

  return StockReceipt;
};
