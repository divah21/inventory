module.exports = (sequelize, DataTypes) => {
  const OpeningStock = sequelize.define(
    'OpeningStock',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      supplier_id: { type: DataTypes.INTEGER },
      quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
      unit: { type: DataTypes.STRING(32) },
      transaction_date: { type: DataTypes.DATEONLY, allowNull: false },
      notes: { type: DataTypes.TEXT },
      upload_batch_id: { type: DataTypes.INTEGER },
    },
    {
      tableName: 'opening_stock',
      indexes: [
        { fields: ['item_id'] },
        { fields: ['warehouse_id'] },
        { fields: ['transaction_date'] },
      ],
    }
  );

  OpeningStock.associate = (m) => {
    OpeningStock.belongsTo(m.Item, { foreignKey: 'item_id', as: 'item' });
    OpeningStock.belongsTo(m.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    OpeningStock.belongsTo(m.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
  };

  return OpeningStock;
};
