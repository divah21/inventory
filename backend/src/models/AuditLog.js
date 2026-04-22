module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER },
      user_email: { type: DataTypes.STRING(255) },
      user_role: { type: DataTypes.STRING(32) },
      method: { type: DataTypes.STRING(16), allowNull: false },
      path: { type: DataTypes.STRING(512), allowNull: false },
      resource: { type: DataTypes.STRING(64) },
      resource_id: { type: DataTypes.STRING(64) },
      status_code: { type: DataTypes.INTEGER },
      ip: { type: DataTypes.STRING(64) },
      user_agent: { type: DataTypes.STRING(512) },
      payload: { type: DataTypes.JSONB },
    },
    {
      tableName: 'audit_logs',
      updatedAt: false,
    }
  );

  AuditLog.associate = (m) => {
    AuditLog.belongsTo(m.User, { foreignKey: 'user_id', as: 'user' });
  };

  return AuditLog;
};
