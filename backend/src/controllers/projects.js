const { Project } = require('../models');
const { crudFactory } = require('./crudFactory');

module.exports = crudFactory({
  model: Project,
  searchFields: ['code', 'name', 'client', 'site_location'],
});
