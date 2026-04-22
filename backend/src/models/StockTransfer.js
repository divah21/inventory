module.exports = (sequelize, DataTypes) => {
  const StockTransfer = sequelize.define(
    'StockTransfer',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { type: DataTypes.INTEGER, allowNull: false },
      from_warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      to_warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
      unit: { type: DataTypes.STRING(32) },
      transaction_date: { type: DataTypes.DATEONLY, allowNull: false },
      reference_no: { type: DataTypes.STRING(64) },
      notes: { type: DataTypes.TEXT },
    },
    {
      tableName: 'stock_transfers',
      indexes: [
        { fields: ['item_id'] },
        { fields: ['from_warehouse_id'] },
        { fields: ['to_warehouse_id'] },
        { fields: ['transaction_date'] },
      ],
      validate: {
        differentWarehouses() {
          if (this.from_warehouse_id === this.to_warehouse_id) {
            throw new Error('from_warehouse_id and to_warehouse_id must differ');
          }
        },
      },
    }
  );

  StockTransfer.associate = (m) => {
    StockTransfer.belongsTo(m.Item, { foreignKey: 'item_id', as: 'item' });
    StockTransfer.belongsTo(m.Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
    StockTransfer.belongsTo(m.Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });
  };

  return StockTransfer;
};
