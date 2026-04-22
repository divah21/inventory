const { StockAdjustment, Item, Warehouse, sequelize } = require('../models');
const { ensureSufficient } = require('../services/StockService');
const { crudFactory } = require('./crudFactory');

const include = [
  { model: Item, as: 'item' },
  { model: Warehouse, as: 'warehouse' },
];

const base = crudFactory({ model: StockAdjustment, defaultInclude: include });

async function create(req, res) {
  const { item_id, warehouse_id, quantity_delta } = req.body;
  await sequelize.transaction(async (t) => {
    if (Number(quantity_delta) < 0) {
      await ensureSufficient({
        itemId: item_id,
        warehouseId: warehouse_id,
        quantity: Math.abs(Number(quantity_delta)),
      });
    }
    const record = await StockAdjustment.create(req.body, { transaction: t });
    const hydrated = await StockAdjustment.findByPk(record.id, { include, transaction: t });
    res.status(201).json(hydrated);
  });
}

module.exports = { ...base, create };
