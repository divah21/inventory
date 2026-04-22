const { IssuedMaterial, Item, Warehouse, Project, sequelize } = require('../models');
const { weekEnding } = require('../utils/dates');
const { ensureSufficient } = require('../services/StockService');
const { crudFactory } = require('./crudFactory');
const { notFound } = require('../utils/errors');

const include = [
  { model: Item, as: 'item' },
  { model: Warehouse, as: 'warehouse' },
  { model: Project, as: 'project' },
];

const base = crudFactory({ model: IssuedMaterial, defaultInclude: include });

async function create(req, res) {
  const { item_id, warehouse_id, quantity, transaction_date } = req.body;
  await sequelize.transaction(async (t) => {
    await ensureSufficient({ itemId: item_id, warehouseId: warehouse_id, quantity });
    const record = await IssuedMaterial.create(
      {
        ...req.body,
        week_ending: req.body.week_ending || weekEnding(transaction_date),
      },
      { transaction: t }
    );
    const hydrated = await IssuedMaterial.findByPk(record.id, { include, transaction: t });
    res.status(201).json(hydrated);
  });
}

async function update(req, res) {
  const record = await IssuedMaterial.findByPk(req.params.id);
  if (!record) throw notFound();
  const patch = { ...req.body };
  if (patch.transaction_date && !patch.week_ending) {
    patch.week_ending = weekEnding(patch.transaction_date);
  }
  // Re-check availability based on prospective net effect
  const deltaItem = patch.item_id ?? record.item_id;
  const deltaWh = patch.warehouse_id ?? record.warehouse_id;
  const oldQty = Number(record.quantity);
  const newQty = Number(patch.quantity ?? record.quantity);
  const delta = newQty - oldQty;
  if (delta > 0) {
    await ensureSufficient({ itemId: deltaItem, warehouseId: deltaWh, quantity: delta });
  }
  await record.update(patch);
  const hydrated = await IssuedMaterial.findByPk(record.id, { include });
  res.json(hydrated);
}

module.exports = { ...base, create, update };
