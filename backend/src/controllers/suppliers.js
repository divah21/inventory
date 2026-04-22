const { Supplier } = require('../models');
const { crudFactory } = require('./crudFactory');

module.exports = crudFactory({
  model: Supplier,
  searchFields: ['name', 'contact_person', 'phone', 'email'],
});
