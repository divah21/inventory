const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const sequelize = new Sequelize(config[env]);

const models = {
  Item: require('./Item')(sequelize, DataTypes),
  Warehouse: require('./Warehouse')(sequelize, DataTypes),
  Supplier: require('./Supplier')(sequelize, DataTypes),
  Project: require('./Project')(sequelize, DataTypes),
  OpeningStock: require('./OpeningStock')(sequelize, DataTypes),
  StockReceipt: require('./StockReceipt')(sequelize, DataTypes),
  IssuedMaterial: require('./IssuedMaterial')(sequelize, DataTypes),
  StockTransfer: require('./StockTransfer')(sequelize, DataTypes),
  StockAdjustment: require('./StockAdjustment')(sequelize, DataTypes),
  PriceListEntry: require('./PriceListEntry')(sequelize, DataTypes),
  User: require('./User')(sequelize, DataTypes),
  AuditLog: require('./AuditLog')(sequelize, DataTypes),
  UploadBatch: require('./UploadBatch')(sequelize, DataTypes),
  PasswordResetToken: require('./PasswordResetToken')(sequelize, DataTypes),
};

// Associations
Object.values(models).forEach((m) => {
  if (typeof m.associate === 'function') m.associate(models);
});

module.exports = { sequelize, Sequelize, ...models };
