const { AuditLog } = require('../models');

// Don't persist password fields even if a screwy client sends them
const REDACT_KEYS = new Set(['password', 'password_hash', 'new_password', 'old_password']);
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (REDACT_KEYS.has(k)) out[k] = '[REDACTED]';
    else if (v && typeof v === 'object') out[k] = redact(v);
    else out[k] = v;
  }
  return out;
}

function resourceFromPath(path) {
  // /api/projects/42 → { resource: 'projects', id: '42' }
  const parts = path.replace(/^\/api\//, '').split('/').filter(Boolean);
  return { resource: parts[0] || null, resource_id: parts[1] || null };
}

/**
 * Logs every mutating request. Attaches after the response is finished so the
 * audit row captures the final status code. Errors here are swallowed so auditing
 * never blocks a successful response.
 */
function auditMiddleware(req, res, next) {
  if (!MUTATING.has(req.method)) return next();
  res.on('finish', () => {
    const { resource, resource_id } = resourceFromPath(req.originalUrl || req.url);
    const payload = redact(req.body);
    AuditLog.create({
      user_id: req.user?.id || null,
      user_email: req.user?.email || null,
      user_role: req.user?.role || null,
      method: req.method,
      path: (req.originalUrl || req.url).split('?')[0].slice(0, 512),
      resource,
      resource_id,
      status_code: res.statusCode,
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      user_agent: (req.headers['user-agent'] || '').toString().slice(0, 512),
      payload,
    }).catch((err) => {
      console.error('[audit] failed to persist audit log:', err.message);
    });
  });
  next();
}

module.exports = { auditMiddleware };
