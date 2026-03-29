/**
 * RFC 7807 (Problem Details for HTTP APIs) Formatter.
 * Takes error data and formats it into a standard JSON object.
 *
 * @param {Object} params - Error parameters.
 * @param {string} [params.type='about:blank'] - Problem type URI.
 * @param {string} [params.title='An unexpected error occurred'] - Problem title.
 * @param {number} [params.status=500] - HTTP status code.
 * @param {string} [params.detail] - Detailed error message.
 * @param {string} [params.instance] - Problem instance URI.
 * @param {string} [params.stack] - Stack trace.
 * @param {boolean} [params.isProduction] - Whether running in production.
 * @returns {Object} Formatted problem details object.
 */
function formatProblemDetails({
  type = 'about:blank',
  title = 'An unexpected error occurred',
  status = 500,
  detail,
  instance,
  stack,
  isProduction = process.env.NODE_ENV === 'production',
}) {
  const problem = {
    type,
    title,
    status,
    detail,
    instance,
  };

  // Only include stack trace if NOT in production for security reasons
  if (!isProduction && stack) {
    problem.stack = stack;
  }

  return problem;
}

module.exports = formatProblemDetails;
