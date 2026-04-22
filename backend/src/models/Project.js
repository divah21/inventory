module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    'Project',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: DataTypes.STRING(64), allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      client: { type: DataTypes.STRING(255) },
      site_location: { type: DataTypes.STRING(255) },
      start_date: { type: DataTypes.DATEONLY },
      end_date: { type: DataTypes.DATEONLY },
      status: {
        type: DataTypes.ENUM('active', 'on_hold', 'completed', 'cancelled'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'projects',
      hooks: {
        beforeValidate(project) {
          if (project.code) {
            project.code = String(project.code).trim().toUpperCase() || null;
          }
          if (project.name) {
            project.name = String(project.name).trim();
          }
        },
      },
    }
  );

  Project.associate = (m) => {
    Project.hasMany(m.IssuedMaterial, { foreignKey: 'project_id', as: 'issuances' });
  };

  return Project;
};
