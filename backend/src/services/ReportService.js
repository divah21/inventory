const { Op, fn, col, literal } = require('sequelize');
const {
  Item,
  Project,
  Warehouse,
  IssuedMaterial,
  StockReceipt,
} = require('../models');

function normalizeRange({ from, to } = {}) {
  const where = {};
  if (from) where.transaction_date = { ...(where.transaction_date || {}), [Op.gte]: from };
  if (to) where.transaction_date = { ...(where.transaction_date || {}), [Op.lte]: to };
  return where;
}

async function weeklySummary({ from, to, projectId, warehouseId } = {}) {
  const where = {
    ...normalizeRange({ from, to }),
    ...(projectId ? { project_id: projectId } : {}),
    ...(warehouseId ? { warehouse_id: warehouseId } : {}),
  };

  const rows = await IssuedMaterial.findAll({
    attributes: [
      [literal(`DATE_TRUNC('week', "transaction_date")::date + INTERVAL '6 days'`), 'week_ending'],
      'project_id',
      'item_id',
      'warehouse_id',
      [fn('SUM', col('quantity')), 'quantity'],
    ],
    where,
    group: [literal(`DATE_TRUNC('week', "transaction_date")`), 'project_id', 'item_id', 'warehouse_id'],
    order: [[literal(`DATE_TRUNC('week', "transaction_date")`), 'ASC']],
    raw: true,
  });

  const [items, projects, warehouses] = await Promise.all([
    Item.findAll(),
    Project.findAll(),
    Warehouse.findAll(),
  ]);
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));
  const projMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const whMap = Object.fromEntries(warehouses.map((w) => [w.id, w]));

  const weekMap = {};
  for (const r of rows) {
    const week = (r.week_ending instanceof Date ? r.week_ending : new Date(r.week_ending))
      .toISOString()
      .slice(0, 10);
    weekMap[week] ??= { week_ending: week, projects: {}, total: 0 };
    const pname = projMap[r.project_id]?.name || 'Unassigned';
    const pid = Number(r.project_id);
    weekMap[week].projects[pid] ??= {
      project_id: pid,
      project_name: pname,
      items: [],
      total_quantity: 0,
    };
    const qty = Number(r.quantity || 0);
    weekMap[week].projects[pid].items.push({
      item_id: Number(r.item_id),
      item_code: itemMap[r.item_id]?.code,
      description: itemMap[r.item_id]?.description,
      unit: itemMap[r.item_id]?.unit,
      warehouse: whMap[r.warehouse_id]?.name,
      warehouse_id: Number(r.warehouse_id),
      quantity: qty,
    });
    weekMap[week].projects[pid].total_quantity += qty;
    weekMap[week].total += qty;
  }

  return Object.values(weekMap)
    .map((w) => ({
      week_ending: w.week_ending,
      total_issued_all_projects: w.total,
      projects: Object.values(w.projects),
    }))
    .sort((a, b) => a.week_ending.localeCompare(b.week_ending));
}

async function monthlySummary({ year, projectId, warehouseId } = {}) {
  const where = {
    ...(warehouseId ? { warehouse_id: warehouseId } : {}),
    ...(projectId ? { project_id: projectId } : {}),
  };
  if (year) {
    where.transaction_date = {
      [Op.gte]: `${year}-01-01`,
      [Op.lte]: `${year}-12-31`,
    };
  }

  const issuedRows = await IssuedMaterial.findAll({
    attributes: [
      [literal(`TO_CHAR(DATE_TRUNC('month', "transaction_date"), 'YYYY-MM')`), 'month'],
      'project_id',
      'item_id',
      [fn('SUM', col('quantity')), 'quantity'],
    ],
    where,
    group: [literal(`DATE_TRUNC('month', "transaction_date")`), 'project_id', 'item_id'],
    raw: true,
  });

  const receivedWhere = year
    ? {
        transaction_date: {
          [Op.gte]: `${year}-01-01`,
          [Op.lte]: `${year}-12-31`,
        },
      }
    : {};
  const receivedRows = await StockReceipt.findAll({
    attributes: [
      [literal(`TO_CHAR(DATE_TRUNC('month', "transaction_date"), 'YYYY-MM')`), 'month'],
      'item_id',
      [fn('SUM', col('quantity')), 'quantity'],
    ],
    where: receivedWhere,
    group: [literal(`DATE_TRUNC('month', "transaction_date")`), 'item_id'],
    raw: true,
  });

  const [items, projects] = await Promise.all([Item.findAll(), Project.findAll()]);
  const itemMap = Object.fromEntries(items.map((i) => [i.id, i]));
  const projMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const monthMap = {};
  for (const r of issuedRows) {
    const m = r.month;
    monthMap[m] ??= {
      month: m,
      projects: {},
      received_by_item: {},
      total_issued: 0,
      total_received: 0,
    };
    const pid = Number(r.project_id);
    monthMap[m].projects[pid] ??= {
      project_id: pid,
      project_name: projMap[pid]?.name || 'Unassigned',
      items: [],
      total_issued: 0,
    };
    const qty = Number(r.quantity || 0);
    monthMap[m].projects[pid].items.push({
      item_id: Number(r.item_id),
      item_code: itemMap[r.item_id]?.code,
      description: itemMap[r.item_id]?.description,
      unit: itemMap[r.item_id]?.unit,
      issued_quantity: qty,
    });
    monthMap[m].projects[pid].total_issued += qty;
    monthMap[m].total_issued += qty;
  }
  for (const r of receivedRows) {
    const m = r.month;
    monthMap[m] ??= {
      month: m,
      projects: {},
      received_by_item: {},
      total_issued: 0,
      total_received: 0,
    };
    const qty = Number(r.quantity || 0);
    monthMap[m].received_by_item[r.item_id] = {
      item_id: Number(r.item_id),
      item_code: itemMap[r.item_id]?.code,
      description: itemMap[r.item_id]?.description,
      unit: itemMap[r.item_id]?.unit,
      received_quantity: qty,
    };
    monthMap[m].total_received += qty;
  }

  return Object.values(monthMap)
    .map((m) => ({
      month: m.month,
      total_issued_all_projects: m.total_issued,
      total_received_all_projects: m.total_received,
      projects: Object.values(m.projects),
      received: Object.values(m.received_by_item),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

async function movementTrends({ from, to } = {}) {
  const where = normalizeRange({ from, to });
  const issued = await IssuedMaterial.findAll({
    attributes: [
      [literal(`TO_CHAR(DATE_TRUNC('month', "transaction_date"), 'YYYY-MM')`), 'month'],
      [fn('SUM', col('quantity')), 'quantity'],
    ],
    where,
    group: [literal(`DATE_TRUNC('month', "transaction_date")`)],
    order: [[literal(`DATE_TRUNC('month', "transaction_date")`), 'ASC']],
    raw: true,
  });
  const received = await StockReceipt.findAll({
    attributes: [
      [literal(`TO_CHAR(DATE_TRUNC('month', "transaction_date"), 'YYYY-MM')`), 'month'],
      [fn('SUM', col('quantity')), 'quantity'],
    ],
    where,
    group: [literal(`DATE_TRUNC('month', "transaction_date")`)],
    order: [[literal(`DATE_TRUNC('month', "transaction_date")`), 'ASC']],
    raw: true,
  });
  return {
    issued: issued.map((r) => ({ month: r.month, quantity: Number(r.quantity || 0) })),
    received: received.map((r) => ({ month: r.month, quantity: Number(r.quantity || 0) })),
  };
}

module.exports = { weeklySummary, monthlySummary, movementTrends };
