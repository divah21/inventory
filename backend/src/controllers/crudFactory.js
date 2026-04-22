const { Op } = require('sequelize');
const { notFound } = require('../utils/errors');

function buildSearchWhere(search, fields) {
  if (!search || !fields.length) return {};
  return { [Op.or]: fields.map((f) => ({ [f]: { [Op.iLike]: `%${search}%` } })) };
}

function crudFactory({ model, searchFields = [], defaultInclude = [] }) {
  return {
    async list(req, res) {
      const { page = 1, pageSize = 50, search, ...filters } = req.query;
      const where = { ...filters, ...buildSearchWhere(search, searchFields) };
      const limit = Math.min(Number(pageSize) || 50, 500);
      const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
      const { rows, count } = await model.findAndCountAll({
        where,
        limit,
        offset,
        include: defaultInclude,
        order: [['id', 'DESC']],
      });
      res.json({ data: rows, total: count, page: Number(page) || 1, pageSize: limit });
    },
    async get(req, res) {
      const row = await model.findByPk(req.params.id, { include: defaultInclude });
      if (!row) throw notFound();
      res.json(row);
    },
    async create(req, res) {
      const row = await model.create(req.body);
      res.status(201).json(row);
    },
    async update(req, res) {
      const row = await model.findByPk(req.params.id);
      if (!row) throw notFound();
      await row.update(req.body);
      res.json(row);
    },
    async remove(req, res) {
      const row = await model.findByPk(req.params.id);
      if (!row) throw notFound();
      await row.destroy();
      res.status(204).end();
    },
  };
}

module.exports = { crudFactory };
