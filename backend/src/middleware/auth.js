const { verifyToken } = require('../utils/auth');
const { HttpError } = require('../utils/errors');

function unauthorized(msg = 'Authentication required') {
  return new HttpError(401, msg);
}
function forbidden(msg = 'Insufficient permissions') {
  return new HttpError(403, msg);
}

function readBearer(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme && /^Bearer$/i.test(scheme) && token) return token;
  return null;
}

function requireAuth(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next(unauthorized());
  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    return next();
  } catch (err) {
    return next(unauthorized(err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token'));
  }
}

function requireRole(...roles) {
  const allowed = new Set(roles);
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!allowed.has(req.user.role)) return next(forbidden());
    next();
  };
}

module.exports = { requireAuth, requireRole };
