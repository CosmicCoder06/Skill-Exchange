// 404 handler — koi bhi route match na ho toh yeh chalega
const notFound = (req, res, next) => {
  const error = new Error(`Route nahi mili: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Central error handler — har controller ke catch block se yahan aayega
// agar tum next(error) call karo
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };