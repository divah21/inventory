const { Warehouse } = require('../models');
const { crudFactory } = require('./crudFactory');

module.exports = crudFactory({ model: Warehouse, searchFields: ['name', 'code', 'location'] });
