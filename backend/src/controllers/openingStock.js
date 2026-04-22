const { OpeningStock, Item, Warehouse, Supplier } = require('../models');
const { crudFactory } = require('./crudFactory');

const include = [
  { model: Item, as: 'item' },
  { model: Warehouse, as: 'warehouse' },
  { model: Supplier, as: 'supplier' },
];

module.exports = crudFactory({ model: OpeningStock, defaultInclude: include });
