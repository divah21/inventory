module.exports = (sequelize, DataTypes) => {
  const IssuedMaterial = sequelize.define(
    'IssuedMaterial',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      item_id: { type: DataTypes.INTEGER, allowNull: false },
      warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
      unit: { type: DataTypes.STRING(32) },
      issued_to: { type: DataTypes.STRING(255) },
      transaction_date: { type: DataTypes.DATEONLY, allowNull: false },
      week_ending: { type: DataTypes.DATEONLY },
      notes: { type: DataTypes.TEXT },
      upload_batch_id: { type: DataTypes.INTEGER },
    },
    {
      tableName: 'issued_materials',
      indexes: [
        { fields: ['item_id'] },
        { fields: ['warehouse_id'] },
        { fields: ['project_id'] },
        { fields: ['transaction_date'] },
        { fields: ['week_ending'] },
      ],
    }
  );

  IssuedMaterial.associate = (m) => {
    IssuedMaterial.belongsTo(m.Item, { foreignKey: 'item_id', as: 'item' });
    IssuedMaterial.belongsTo(m.Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
    IssuedMaterial.belongsTo(m.Project, { foreignKey: 'project_id', as: 'project' });
  };

  return IssuedMaterial;
};
