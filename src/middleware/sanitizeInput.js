const { sanitizeValue } = require('../utils/sanitization');

/**
 * Express middleware that sanitizes common user-supplied input containers.
 *
 * The middleware mutates request references with sanitized copies so downstream
 * handlers always receive normalized values.
 *
 * @param {import('express').Request} req Express request.
 * @param {import('express').Response} _res Express response.
 * @param {import('express').NextFunction} next Express next callback.
 * @returns {void}
 */
function sanitizeInput(req, _res, next) {
  req.body = sanitizeValue(req.body);

  let sanitizedQuery = sanitizeValue(req.query);
  Object.defineProperty(req, 'query', {
    configurable: true,
    enumerable: true,
    get() {
      return sanitizedQuery;
    },
    set(value) {
      sanitizedQuery = sanitizeValue(value);
    },
  });

  let sanitizedParams = sanitizeValue(req.params);
  Object.defineProperty(req, 'params', {
    configurable: true,
    enumerable: true,
    get() {
      return sanitizedParams;
    },
    set(value) {
      sanitizedParams = sanitizeValue(value);
    },
  });

  next();
}

module.exports = {
  sanitizeInput,
};
