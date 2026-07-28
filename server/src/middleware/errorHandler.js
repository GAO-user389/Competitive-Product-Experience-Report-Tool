function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: status === 500 ? "Internal server error" : err.message
    }
  });
}

module.exports = { errorHandler };
