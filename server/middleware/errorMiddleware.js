function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ success: false, message: 'That email is already registered.' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server.'
  });
}

module.exports = { notFound, errorHandler };
