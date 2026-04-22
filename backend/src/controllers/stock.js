const StockService = require('../services/StockService');

async function availability(req, res) {
  const rows = await StockService.getAvailability({
    itemId: req.query.itemId ? Number(req.query.itemId) : undefined,
    warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
    itemCode: req.query.code,
    search: req.query.search,
    lowStockOnly: req.query.lowStockOnly === 'true',
  });
  res.json({ data: rows, total: rows.length });
}

async function dashboard(req, res) {
  const data = await StockService.getDashboardTotals();
  res.json(data);
}

module.exports = { availability, dashboard };
