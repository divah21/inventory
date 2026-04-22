module.exports = (sequelize, DataTypes) => {
  const StockAdjustment = sequelize.define(
    'StockAdjustment',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity_delta: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
      reason: { type: DataTypes.STRING(255), allowNull: false },
      transaction_date: { type: DataTypes.DATEONLY, allowNull: false },
      notes: { type: DataTypes.TEXT },
    },
    {
      tableName: 'stock_adjustments',
      indexes: [
        { fields: ['item_id'] },
        { fields: ['warehouse_id'] },
        { fields: ['transaction_date'] },
      ],
    }
  );

  StockAdjustment.associate = (m) => {
    StockAdjustment.belongsTo(m.Item, { foreignKey: 'item_id', as: 'item' });
    StockAdjustment.belongsTo(m.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
  };

  return StockAdjustment;
};
