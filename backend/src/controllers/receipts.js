const { StockReceipt, Item, Warehouse, Supplier } = require('../models');
const { crudFactory } = require('./crudFactory');

const include = [
  { model: Item, as: 'item' },
  { model: Warehouse, as: 'warehouse' },
  { model: Supplier, as: 'supplier' },
];

module.exports = crudFactory({ model: StockReceipt, defaultInclude: include });
