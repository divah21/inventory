const { Item } = require('../models');
const { crudFactory } = require('./crudFactory');

module.exports = crudFactory({ model: Item, searchFields: ['code', 'description', 'category'] });
