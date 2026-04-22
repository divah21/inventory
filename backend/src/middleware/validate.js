const { badRequest } = require('../utils/errors');

module.exports = function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      return next(
        badRequest(
          'Validation error',
          error.details.map((d) => ({ field: d.path.join('.'), message: d.message }))
        )
      );
    }
    req[source] = value;
    next();
  };
};
