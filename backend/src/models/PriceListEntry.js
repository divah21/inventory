module.exports = (sequelize, DataTypes) => {
  const PriceListEntry = sequelize.define(
    'PriceListEntry',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      material_code: { type: DataTypes.STRING(64), allowNull: false },
      description: { type: DataTypes.TEXT },
      amount: { type: DataTypes.DECIMAL(14, 2) },
      currency: { type: DataTypes.STRING(8), defaultValue: 'EUR' },
      effective_date: { type: DataTypes.DATEONLY },
      upload_batch_id: { type: DataTypes.INTEGER },
    },
    {
      tableName: 'price_list_entries',
      indexes: [{ fields: ['material_code'] }],
    }
  );

  return PriceListEntry;
};
