const { ZodError } = require('zod');

class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, next) {
  // If response has already started sending
  if (res.headersSent) {
    return next(err);
  }

  // Zod schema validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: formattedErrors
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // SQLite Constraint Errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Conflict: A record with these unique details already exists.',
      code: 'DUPLICATE_RECORD',
      details: err.message
    });
  }

  if (err.message && err.message.includes('CHECK constraint failed')) {
    return res.status(400).json({
      error: 'Constraint violation: Supplied data violates database check constraint.',
      code: 'CHECK_CONSTRAINT_FAILED',
      details: err.message
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large. Maximum allowed size is 25MB.',
      code: 'FILE_TOO_LARGE'
    });
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
  });
}

module.exports = {
  errorHandler,
  AppError
};
