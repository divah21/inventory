const ReportService = require('../services/ReportService');

async function weekly(req, res) {
  const { from, to, projectId, warehouseId } = req.query;
  const data = await ReportService.weeklySummary({
    from,
    to,
    projectId: projectId ? Number(projectId) : undefined,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
  });
  res.json({ data });
}

async function monthly(req, res) {
  const { year, projectId, warehouseId } = req.query;
  const data = await ReportService.monthlySummary({
    year: year ? Number(year) : undefined,
    projectId: projectId ? Number(projectId) : undefined,
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
  });
  res.json({ data });
}

async function trends(req, res) {
  const { from, to } = req.query;
  const data = await ReportService.movementTrends({ from, to });
  res.json(data);
}

module.exports = { weekly, monthly, trends };
