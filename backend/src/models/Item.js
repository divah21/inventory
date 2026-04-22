module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    'Item',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false },
      unit: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'pcs' },
      category: { type: DataTypes.STRING(128) },
      reorder_level: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
      unit_price: { type: DataTypes.DECIMAL(14, 2) },
      currency: { type: DataTypes.STRING(8), defaultValue: 'UGX' },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'items',
      indexes: [
        { fields: ['code'], unique: true },
        { fields: ['description'] },
      ],
    }
  );

  Item.associate = (m) => {
    Item.hasMany(m.OpeningStock, { foreignKey: 'item_id', as: 'openings' });
    Item.hasMany(m.StockReceipt, { foreignKey: 'item_id', as: 'receipts' });
    Item.hasMany(m.IssuedMaterial, { foreignKey: 'item_id', as: 'issuances' });
    Item.hasMany(m.StockTransfer, { foreignKey: 'item_id', as: 'transfers' });
    Item.hasMany(m.StockAdjustment, { foreignKey: 'item_id', as: 'adjustments' });
  };

  return Item;
};
