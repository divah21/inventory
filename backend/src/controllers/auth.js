const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, PasswordResetToken } = require('../models');
const { hashPassword, verifyPassword, signToken } = require('../utils/auth');
const { badRequest, HttpError } = require('../utils/errors');

const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES) || 60;

function toPublicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    is_active: u.is_active,
    last_login_at: u.last_login_at,
  };
}

function hashResetToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.scope('withPassword').findOne({
    where: { email: String(email || '').trim().toLowerCase() },
  });
  if (!user || !user.is_active) throw new HttpError(401, 'Invalid credentials');
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new HttpError(401, 'Invalid credentials');
  user.last_login_at = new Date();
  await user.save();
  const token = signToken(user);
  res.json({ token, user: toPublicUser(user) });
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ where: { email } });
  // Always respond identically to avoid leaking which emails have accounts.
  if (user && user.is_active) {
    const raw = crypto.randomBytes(32).toString('hex');
    const token_hash = hashResetToken(raw);
    const expires_at = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    await PasswordResetToken.update(
      { used_at: new Date() },
      { where: { user_id: user.id, used_at: null } }
    );
    await PasswordResetToken.create({ user_id: user.id, token_hash, expires_at });
    const base = process.env.APP_URL || 'http://localhost:3000';
    const link = `${base}/reset-password?token=${raw}`;
    // TODO: send via email provider once one is configured. For now the link
    // is logged so ops can deliver it out-of-band during early deployment.
    console.log('─'.repeat(70));
    console.log(`[auth] password reset requested for ${email}`);
    console.log(`[auth]   link:    ${link}`);
    console.log(`[auth]   expires: ${expires_at.toISOString()}`);
    console.log('─'.repeat(70));
  }
  res.json({ ok: true });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  const token_hash = hashResetToken(String(token));
  const record = await PasswordResetToken.findOne({
    where: {
      token_hash,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });
  if (!record) throw new HttpError(400, 'This reset link is invalid or has expired.');
  const user = await User.findByPk(record.user_id);
  if (!user || !user.is_active) {
    throw new HttpError(400, 'This reset link is invalid or has expired.');
  }
  user.password_hash = await hashPassword(password);
  await user.save();
  record.used_at = new Date();
  await record.save();
  res.json({ ok: true });
}

async function me(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new HttpError(401, 'User no longer exists');
  res.json({ user: toPublicUser(user) });
}

async function listUsers(req, res) {
  const { page = 1, pageSize = 50, search } = req.query;
  const limit = Math.min(Number(pageSize) || 50, 200);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
  const where = search
    ? { [Op.or]: [{ email: { [Op.iLike]: `%${search}%` } }, { name: { [Op.iLike]: `%${search}%` } }] }
    : {};
  const { rows, count } = await User.findAndCountAll({ where, limit, offset, order: [['id', 'DESC']] });
  res.json({ data: rows, total: count, page: Number(page) || 1, pageSize: limit });
}

async function createUser(req, res) {
  const { email, name, password, role = 'user' } = req.body;
  if (!password || password.length < 8) throw badRequest('Password must be at least 8 characters.');
  const password_hash = await hashPassword(password);
  const user = await User.create({ email, name, password_hash, role });
  res.status(201).json(toPublicUser(user));
}

async function updateUser(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  const patch = { ...req.body };
  if (patch.password) {
    if (patch.password.length < 8) throw badRequest('Password must be at least 8 characters.');
    patch.password_hash = await hashPassword(patch.password);
    delete patch.password;
  }
  await user.update(patch);
  res.json(toPublicUser(user));
}

async function deleteUser(req, res) {
  if (Number(req.params.id) === req.user.id) throw badRequest('You cannot delete yourself.');
  const user = await User.findByPk(req.params.id);
  if (!user) throw new HttpError(404, 'User not found');
  await user.destroy();
  res.status(204).end();
}

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  me,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
