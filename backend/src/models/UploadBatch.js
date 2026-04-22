module.exports = (sequelize, DataTypes) => {
  const UploadBatch = sequelize.define(
    'UploadBatch',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER },
      filename: { type: DataTypes.STRING(255) },
      size_bytes: { type: DataTypes.INTEGER },
      file_hash: { type: DataTypes.STRING(128) },
      summary: { type: DataTypes.JSONB },
      status: {
        type: DataTypes.ENUM('completed', 'reverted', 'failed'),
        allowNull: false,
        defaultValue: 'completed',
      },
      reverted_at: { type: DataTypes.DATE },
      reverted_by: { type: DataTypes.INTEGER },
    },
    { tableName: 'upload_batches' }
  );

  UploadBatch.associate = (m) => {
    UploadBatch.belongsTo(m.User, { foreignKey: 'user_id', as: 'uploader' });
    UploadBatch.belongsTo(m.User, { foreignKey: 'reverted_by', as: 'reverter' });
    UploadBatch.hasMany(m.OpeningStock, { foreignKey: 'upload_batch_id' });
    UploadBatch.hasMany(m.StockReceipt, { foreignKey: 'upload_batch_id' });
    UploadBatch.hasMany(m.IssuedMaterial, { foreignKey: 'upload_batch_id' });
    UploadBatch.hasMany(m.PriceListEntry, { foreignKey: 'upload_batch_id' });
  };

  return UploadBatch;
};
