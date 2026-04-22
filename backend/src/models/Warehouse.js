module.exports = (sequelize, DataTypes) => {
  const Warehouse = sequelize.define(
    'Warehouse',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(128), allowNull: false, unique: true },
      code: { type: DataTypes.STRING(64) },
      location: { type: DataTypes.STRING(255) },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'warehouses' }
  );

  Warehouse.associate = (m) => {
    Warehouse.hasMany(m.OpeningStock, { foreignKey: 'warehouse_id' });
    Warehouse.hasMany(m.StockReceipt, { foreignKey: 'warehouse_id' });
    Warehouse.hasMany(m.IssuedMaterial, { foreignKey: 'warehouse_id' });
    Warehouse.hasMany(m.StockTransfer, { foreignKey: 'from_warehouse_id', as: 'transfersOut' });
    Warehouse.hasMany(m.StockTransfer, { foreignKey: 'to_warehouse_id', as: 'transfersIn' });
    Warehouse.hasMany(m.StockAdjustment, { foreignKey: 'warehouse_id' });
  };

  return Warehouse;
};
