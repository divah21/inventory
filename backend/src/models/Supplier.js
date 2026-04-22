module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    'Supplier',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      contact_person: { type: DataTypes.STRING(128) },
      phone: { type: DataTypes.STRING(64) },
      email: { type: DataTypes.STRING(128) },
      address: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'suppliers' }
  );

  Supplier.associate = (m) => {
    Supplier.hasMany(m.OpeningStock, { foreignKey: 'supplier_id' });
    Supplier.hasMany(m.StockReceipt, { foreignKey: 'supplier_id' });
  };

  return Supplier;
};
