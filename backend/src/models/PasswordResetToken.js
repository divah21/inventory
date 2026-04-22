module.exports = (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define(
    'PasswordResetToken',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      token_hash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE },
    },
    {
      tableName: 'password_reset_tokens',
      updatedAt: false,
    }
  );

  PasswordResetToken.associate = (m) => {
    PasswordResetToken.belongsTo(m.User, { foreignKey: 'user_id', as: 'user' });
  };

  return PasswordResetToken;
};
