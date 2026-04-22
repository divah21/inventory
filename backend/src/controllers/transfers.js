const { StockTransfer, Item, Warehouse, sequelize } = require('../models');
const { ensureSufficient } = require('../services/StockService');
const { crudFactory } = require('./crudFactory');
const { notFound, badRequest } = require('../utils/errors');

const include = [
  { model: Item, as: 'item' },
  { model: Warehouse, as: 'fromWarehouse' },
  { model: Warehouse, as: 'toWarehouse' },
];

const base = crudFactory({ model: StockTransfer, defaultInclude: include });

async function create(req, res) {
  const { item_id, from_warehouse_id, to_warehouse_id, quantity } = req.body;
  if (from_warehouse_id === to_warehouse_id) {
    throw badRequest('from_warehouse_id and to_warehouse_id must differ');
  }
  await sequelize.transaction(async (t) => {
    await ensureSufficient({ itemId: item_id, warehouseId: from_warehouse_id, quantity });
    const record = await StockTransfer.create(req.body, { transaction: t });
    const hydrated = await StockTransfer.findByPk(record.id, { include, transaction: t });
    res.status(201).json(hydrated);
  });
}

async function update(req, res) {
  const record = await StockTransfer.findByPk(req.params.id);
  if (!record) throw notFound();
  await record.update(req.body);
  const hydrated = await StockTransfer.findByPk(record.id, { include });
  res.json(hydrated);
}

module.exports = { ...base, create, update };
