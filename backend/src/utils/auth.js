const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

if (!process.env.JWT_SECRET) {
  console.warn(
    '[auth] JWT_SECRET not set — using INSECURE dev default. Set JWT_SECRET in production.'
  );
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
