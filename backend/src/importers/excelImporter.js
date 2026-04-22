/*
 * Excel importer — seeds the database from INTERPLUMB INVENTORY.xlsx.
 *
 * Expected sheets (matches the workbook supplied by operations):
 *   - OPENING STOCK:   DATE | SUPPLIER | QNTY | UNIT | CODE | Article description | LOCATION
 *   - STOCK RECEIVED:  DATE | SUPPLIER | Invoice | QNTY | UNIT | CODE | Article description | LOCATION
 *   - ISSUED MATERIAL: WEEK ENDING | ISSUED TO | CODE | Article description | QNTY | UNIT | STOCK WAREHOUSE
 *   - SETTINGS:        Warehouses list (one per row under the "Warehouses" header)
 *   - Price List:      Material | Material Description | Amount | Condition currency
 *
 * Usage: node src/importers/excelImporter.js [path-to-xlsx]
 */

require('dotenv').config();
const path = require('path');
const ExcelJS = require('exceljs');

const {
  sequelize,
  Item,
  Warehouse,
  Supplier,
  Project,
  OpeningStock,
  StockReceipt,
  IssuedMaterial,
  PriceListEntry,
} = require('../models');
const { weekEnding } = require('../utils/dates');

const SRC = process.argv[2] || process.env.EXCEL_SOURCE_PATH;

function normalize(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (v && typeof v === 'object' && 'result' in v) return v.result; // formula cells
  return v;
}

function numeric(v) {
  const n = normalize(v);
  if (n === null || n === '') return null;
  const num = Number(n);
  return Number.isFinite(num) ? num : null;
}

function dateVal(v) {
  const n = normalize(v);
  if (!n) return null;
  if (n instanceof Date) return n.toISOString().slice(0, 10);
  const d = new Date(n);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function warehouseKey(v) {
  const n = normalize(v);
  if (n === null) return null;
  // Numeric warehouse id in receipts sheet means "Container N"
  if (typeof n === 'number' || (!Number.isNaN(Number(n)) && typeof n !== 'string')) {
    return `Container ${Number(n)}`;
  }
  return String(n).replace(/\s+/g, ' ').trim();
}

async function upsertItem(code, description, unit) {
  if (!code) return null;
  const cleanCode = String(code).trim();
  if (!cleanCode) return null;
  const [item] = await Item.findOrCreate({
    where: { code: cleanCode },
    defaults: { code: cleanCode, description: description || cleanCode, unit: unit || 'pcs' },
  });
  if (description && (!item.description || item.description === item.code)) {
    await item.update({ description });
  }
  return item;
}

async function upsertWarehouse(name) {
  const cleanName = warehouseKey(name);
  if (!cleanName) return null;
  const [wh] = await Warehouse.findOrCreate({
    where: { name: cleanName },
    defaults: { name: cleanName },
  });
  return wh;
}

async function upsertSupplier(name) {
  const clean = normalize(name);
  if (!clean) return null;
  const [sup] = await Supplier.findOrCreate({
    where: { name: String(clean) },
    defaults: { name: String(clean) },
  });
  return sup;
}

async function upsertProject(name) {
  const clean = String(normalize(name) || 'Unassigned').trim();
  // Case-insensitive lookup so re-imports don't create Stanbic Bank / stanbic bank duplicates.
  const existing = await Project.findOne({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('name')),
      clean.toLowerCase()
    ),
  });
  if (existing) return existing;
  return Project.create({ name: clean, status: 'active' });
}

function readHeaderRowIndex(ws, mustInclude) {
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    const row = ws.getRow(r);
    const values = row.values.map((v) => String(normalize(v) || '').toLowerCase());
    if (mustInclude.every((m) => values.some((v) => v.includes(m)))) return r;
  }
  return null;
}

function columnMap(ws, headerRow) {
  const map = {};
  const row = ws.getRow(headerRow);
  row.eachCell((cell, colNumber) => {
    const key = String(normalize(cell.value) || '').toLowerCase();
    if (key) map[key] = colNumber;
  });
  return map;
}

function pick(row, map, candidates) {
  for (const c of candidates) {
    const key = Object.keys(map).find((k) => k.includes(c));
    if (key) {
      const val = row.getCell(map[key]).value;
      if (val !== null && val !== undefined && val !== '') return val;
    }
  }
  return null;
}

async function importSettingsWarehouses(ws) {
  if (!ws) return 0;
  let count = 0;
  let inWarehouses = false;
  for (let r = 1; r <= ws.rowCount; r++) {
    const v = normalize(ws.getRow(r).getCell(1).value);
    if (!v) continue;
    if (String(v).toLowerCase() === 'warehouses') {
      inWarehouses = true;
      continue;
    }
    if (inWarehouses) {
      if (/projects?/i.test(String(v))) break;
      const wh = await upsertWarehouse(v);
      if (wh) count++;
    }
  }
  return count;
}

async function importOpeningStock(ws, batchId) {
  if (!ws) return 0;
  const headerRow = readHeaderRowIndex(ws, ['qnty', 'code']);
  if (!headerRow) return 0;
  const map = columnMap(ws, headerRow);
  let count = 0;
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const code = normalize(pick(row, map, ['code']));
    const description = normalize(pick(row, map, ['article description', 'description']));
    const qty = numeric(pick(row, map, ['qnty', 'qty']));
    const unit = normalize(pick(row, map, ['unit']));
    const location = pick(row, map, ['location', 'warehouse']);
    const date = dateVal(pick(row, map, ['date']));
    const supplier = normalize(pick(row, map, ['suplier', 'supplier']));
    if (!code || !qty || !location) continue;
    const [item, wh, sup] = await Promise.all([
      upsertItem(code, description, unit),
      upsertWarehouse(location),
      supplier ? upsertSupplier(supplier) : null,
    ]);
    if (!item || !wh) continue;
    await OpeningStock.create({
      item_id: item.id,
      warehouse_id: wh.id,
      supplier_id: sup?.id,
      quantity: qty,
      unit,
      transaction_date: date || new Date().toISOString().slice(0, 10),
      upload_batch_id: batchId || null,
    });
    count++;
  }
  return count;
}

async function importStockReceived(ws, batchId) {
  if (!ws) return 0;
  const headerRow = readHeaderRowIndex(ws, ['qnty', 'code']);
  if (!headerRow) return 0;
  const map = columnMap(ws, headerRow);
  let count = 0;
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const code = normalize(pick(row, map, ['code']));
    const description = normalize(pick(row, map, ['article description', 'description']));
    const qty = numeric(pick(row, map, ['qnty', 'qty']));
    const unit = normalize(pick(row, map, ['unit']));
    const location = pick(row, map, ['location', 'warehouse']);
    const date = dateVal(pick(row, map, ['date']));
    const supplier = normalize(pick(row, map, ['supplier', 'suplier']));
    const invoice = normalize(pick(row, map, ['invoice', 'receipt']));
    if (!code || !qty || !location) continue;
    const [item, wh, sup] = await Promise.all([
      upsertItem(code, description, unit),
      upsertWarehouse(location),
      supplier ? upsertSupplier(supplier) : null,
    ]);
    if (!item || !wh) continue;
    await StockReceipt.create({
      item_id: item.id,
      warehouse_id: wh.id,
      supplier_id: sup?.id,
      quantity: qty,
      unit,
      invoice_no: invoice ? String(invoice) : null,
      transaction_date: date || new Date().toISOString().slice(0, 10),
      upload_batch_id: batchId || null,
    });
    count++;
  }
  return count;
}

async function importIssuedMaterials(ws, batchId) {
  if (!ws) return 0;
  const headerRow = readHeaderRowIndex(ws, ['qnty', 'code']);
  if (!headerRow) return 0;
  const map = columnMap(ws, headerRow);
  let count = 0;
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const code = normalize(pick(row, map, ['code']));
    const description = normalize(pick(row, map, ['article description', 'description']));
    const qty = numeric(pick(row, map, ['qnty', 'qty']));
    const unit = normalize(pick(row, map, ['unit']));
    const location = pick(row, map, ['warehouse', 'location']);
    const weekEnd = dateVal(pick(row, map, ['week ending', 'date']));
    const issuedTo = normalize(pick(row, map, ['issued to']));
    if (!code || !qty || !location) continue;
    const project = await upsertProject(issuedTo || 'Unassigned');
    const [item, wh] = await Promise.all([
      upsertItem(code, description, unit),
      upsertWarehouse(location),
    ]);
    if (!item || !wh) continue;
    await IssuedMaterial.create({
      item_id: item.id,
      warehouse_id: wh.id,
      project_id: project.id,
      quantity: qty,
      unit,
      issued_to: issuedTo,
      transaction_date: weekEnd || new Date().toISOString().slice(0, 10),
      week_ending: weekEnd || weekEnding(new Date()),
      upload_batch_id: batchId || null,
    });
    count++;
  }
  return count;
}

async function importPriceList(ws, batchId) {
  if (!ws) return 0;
  const headerRow = readHeaderRowIndex(ws, ['material', 'amount']);
  if (!headerRow) return 0;
  const map = columnMap(ws, headerRow);
  let count = 0;
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const code = normalize(pick(row, map, ['material']));
    const desc = normalize(pick(row, map, ['description']));
    const amount = numeric(pick(row, map, ['amount']));
    const currency = normalize(pick(row, map, ['currency']));
    if (!code) continue;
    await PriceListEntry.create({
      material_code: String(code),
      description: desc,
      amount,
      currency: currency || 'EUR',
      upload_batch_id: batchId || null,
    });
    count++;
  }
  return count;
}

async function importWorkbook(wb, { batchId } = {}) {
  const bySheet = (name) =>
    wb.worksheets.find((s) => s.name.toLowerCase() === name.toLowerCase());

  const t = await sequelize.transaction();
  try {
    const settings = await importSettingsWarehouses(bySheet('SETTINGS'));
    const opening = await importOpeningStock(bySheet('OPENING STOCK'), batchId);
    const received = await importStockReceived(bySheet('STOCK RECEIVED'), batchId);
    const issued = await importIssuedMaterials(bySheet('ISSUED MATERIAL'), batchId);
    const price = await importPriceList(bySheet('Price List'), batchId);
    await t.commit();
    return {
      warehouses_from_settings: settings,
      opening_stock_rows: opening,
      stock_received_rows: received,
      issued_material_rows: issued,
      price_list_rows: price,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function importFromBuffer(buffer, opts = {}) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return importWorkbook(wb, opts);
}

async function importFromFile(filePath, opts = {}) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  return importWorkbook(wb, opts);
}

async function run() {
  if (!SRC) {
    console.error('Provide path to xlsx or set EXCEL_SOURCE_PATH env var.');
    process.exit(1);
  }
  console.log('Reading', path.resolve(SRC));
  await sequelize.authenticate();
  try {
    const summary = await importFromFile(SRC);
    console.log('Imported:', summary);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
  await sequelize.close();
}

if (require.main === module) run();
module.exports = { run, importFromBuffer, importFromFile };
