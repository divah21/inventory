const { Op, fn, col, literal } = require('sequelize');
const {
  sequelize,
  Item,
  Warehouse,
  OpeningStock,
  StockReceipt,
  IssuedMaterial,
  StockTransfer,
  StockAdjustment,
} = require('../models');
const { badRequest, notFound } = require('../utils/errors');

/**
 * Stock availability per (item, warehouse) is computed as:
 *   opening + received + transfers_in - transfers_out - issued + adjustments
 *
 * This mirrors the logic from the Excel workbook's STOCK AVAILABILITY sheet
 * but scopes it to warehouse-level granularity.
 */
async function getAvailability({ itemId, warehouseId, itemCode, search, lowStockOnly } = {}) {
  const itemWhere = {};
  if (itemId) itemWhere.id = itemId;
  if (itemCode) itemWhere.code = itemCode;
  if (search) {
    itemWhere[Op.or] = [
      { code: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const items = await Item.findAll({ where: itemWhere });
  if (!items.length) return [];

  // Aggregate helper per table
  const agg = async (model, qtyCol, groupCols, whereExtra = {}) => {
    const rows = await model.findAll({
      attributes: [...groupCols, [fn('SUM', col(qtyCol)), 'total']],
      where: {
        item_id: { [Op.in]: items.map((i) => i.id) },
        ...(warehouseId
          ? groupCols.includes('warehouse_id')
            ? { warehouse_id: warehouseId }
            : {}
          : {}),
        ...whereExtra,
      },
      group: groupCols,
      raw: true,
    });
    return rows;
  };

  const [openings, receipts, issuances, adjustments, transfersOut, transfersIn] =
    await Promise.all([
      agg(OpeningStock, 'quantity', ['item_id', 'warehouse_id']),
      agg(StockReceipt, 'quantity', ['item_id', 'warehouse_id']),
      agg(IssuedMaterial, 'quantity', ['item_id', 'warehouse_id']),
      agg(StockAdjustment, 'quantity_delta', ['item_id', 'warehouse_id']),
      StockTransfer.findAll({
        attributes: [
          'item_id',
          ['from_warehouse_id', 'warehouse_id'],
          [fn('SUM', col('quantity')), 'total'],
        ],
        where: {
          item_id: { [Op.in]: items.map((i) => i.id) },
          ...(warehouseId ? { from_warehouse_id: warehouseId } : {}),
        },
        group: ['item_id', 'from_warehouse_id'],
        raw: true,
      }),
      StockTransfer.findAll({
        attributes: [
          'item_id',
          ['to_warehouse_id', 'warehouse_id'],
          [fn('SUM', col('quantity')), 'total'],
        ],
        where: {
          item_id: { [Op.in]: items.map((i) => i.id) },
          ...(warehouseId ? { to_warehouse_id: warehouseId } : {}),
        },
        group: ['item_id', 'to_warehouse_id'],
        raw: true,
      }),
    ]);

  const key = (r) => `${r.item_id}-${r.warehouse_id}`;
  const bucket = {};
  const ensure = (r) => {
    const k = key(r);
    if (!bucket[k]) {
      bucket[k] = {
        item_id: Number(r.item_id),
        warehouse_id: Number(r.warehouse_id),
        opening: 0,
        received: 0,
        issued: 0,
        transferred_in: 0,
        transferred_out: 0,
        adjustments: 0,
      };
    }
    return bucket[k];
  };
  openings.forEach((r) => (ensure(r).opening += Number(r.total || 0)));
  receipts.forEach((r) => (ensure(r).received += Number(r.total || 0)));
  issuances.forEach((r) => (ensure(r).issued += Number(r.total || 0)));
  adjustments.forEach((r) => (ensure(r).adjustments += Number(r.total || 0)));
  transfersOut.forEach((r) => (ensure(r).transferred_out += Number(r.total || 0)));
  transfersIn.forEach((r) => (ensure(r).transferred_in += Number(r.total || 0)));

  const warehouseIds = [...new Set(Object.values(bucket).map((b) => b.warehouse_id))];
  const warehouses = warehouseIds.length
    ? await Warehouse.findAll({ where: { id: { [Op.in]: warehouseIds } } })
    : [];
  const whMap = Object.fromEntries(warehouses.map((w) => [w.id, w]));
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));

  let rows = Object.values(bucket).map((b) => {
    const on_hand =
      b.opening + b.received + b.transferred_in - b.transferred_out - b.issued + b.adjustments;
    const item = itemMap[b.item_id];
    return {
      item_id: b.item_id,
      item_code: item?.code,
      description: item?.description,
      unit: item?.unit,
      warehouse_id: b.warehouse_id,
      warehouse: whMap[b.warehouse_id]?.name,
      opening: b.opening,
      received: b.received,
      transferred_in: b.transferred_in,
      transferred_out: b.transferred_out,
      issued: b.issued,
      adjustments: b.adjustments,
      on_hand,
      reorder_level: Number(item?.reorder_level || 0),
      is_low_stock: on_hand <= Number(item?.reorder_level || 0),
    };
  });

  if (lowStockOnly) rows = rows.filter((r) => r.is_low_stock);
  rows.sort((a, b) => (a.item_code || '').localeCompare(b.item_code || ''));
  return rows;
}

async function getOnHand({ itemId, warehouseId }) {
  const rows = await getAvailability({ itemId, warehouseId });
  if (!rows.length) return 0;
  return rows.reduce((s, r) => s + r.on_hand, 0);
}

async function ensureSufficient({ itemId, warehouseId, quantity }) {
  const rows = await getAvailability({ itemId, warehouseId });
  const row = rows.find((r) => r.item_id === Number(itemId) && r.warehouse_id === Number(warehouseId));
  const available = row ? row.on_hand : 0;
  if (Number(quantity) > available) {
    throw badRequest(
      `Insufficient stock. Available: ${available}, requested: ${quantity}`,
      { available, requested: Number(quantity) }
    );
  }
  return available;
}

async function getDashboardTotals() {
  const [openingTotal, receivedTotal, issuedTotal, lowStock] = await Promise.all([
    OpeningStock.sum('quantity'),
    StockReceipt.sum('quantity'),
    IssuedMaterial.sum('quantity'),
    getAvailability({ lowStockOnly: true }),
  ]);

  const availability = await getAvailability({});
  const totalOnHand = availability.reduce((s, r) => s + r.on_hand, 0);

  const topIssuedRows = await IssuedMaterial.findAll({
    attributes: ['item_id', [fn('SUM', col('quantity')), 'total']],
    group: ['item_id'],
    order: [[literal('total'), 'DESC']],
    limit: 10,
    raw: true,
  });
  const topItemIds = topIssuedRows.map((r) => Number(r.item_id));
  const topItems = topItemIds.length
    ? await Item.findAll({ where: { id: { [Op.in]: topItemIds } } })
    : [];
  const topMap = Object.fromEntries(topItems.map((i) => [i.id, i]));
  const most_issued = topIssuedRows.map((r) => ({
    item_id: Number(r.item_id),
    code: topMap[r.item_id]?.code,
    description: topMap[r.item_id]?.description,
    total_issued: Number(r.total || 0),
  }));

  return {
    opening_total: Number(openingTotal || 0),
    received_total: Number(receivedTotal || 0),
    issued_total: Number(issuedTotal || 0),
    on_hand_total: totalOnHand,
    low_stock_count: lowStock.length,
    low_stock_items: lowStock.slice(0, 25),
    most_issued,
  };
}

module.exports = {
  getAvailability,
  getOnHand,
  ensureSufficient,
  getDashboardTotals,
  sequelize,
};
async function assertItemExists(id) {
  const item = await Item.findByPk(id);
  if (!item) throw notFound('Item not found');
  return item;
}
module.exports.assertItemExists = assertItemExists;
