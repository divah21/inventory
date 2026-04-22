const { HttpError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err && err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err && err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Duplicate value', details: err.errors.map((e) => e.message) });
  }
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}`, code: err.code });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
};
