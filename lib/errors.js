class ApiError extends Error {
  constructor(statusCode, message, code = 'SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function handleError(err, res, logPrefix = '') {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  console.error(`${logPrefix}${logPrefix ? ' ' : ''}error:`, err.message);
  return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
}

module.exports = { ApiError, handleError };
