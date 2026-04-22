const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');

async function list(req, res) {
  const {
    page = 1,
    pageSize = 50,
    search,
    method,
    resource,
    user_id,
    from,
    to,
  } = req.query;
  const limit = Math.min(Number(pageSize) || 50, 200);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const where = {};
  if (method) where.method = method;
  if (resource) where.resource = resource;
  if (user_id) where.user_id = user_id;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to) where.created_at[Op.lte] = new Date(to);
  }
  if (search) {
    where[Op.or] = [
      { path: { [Op.iLike]: `%${search}%` } },
      { user_email: { [Op.iLike]: `%${search}%` } },
      { resource: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'email', 'name', 'role'] }],
    limit,
    offset,
    order: [['id', 'DESC']],
  });
  res.json({ data: rows, total: count, page: Number(page) || 1, pageSize: limit });
}

module.exports = { list };
