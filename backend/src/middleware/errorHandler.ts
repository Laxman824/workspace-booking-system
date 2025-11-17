import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle specific error types
  if (err.message.includes('not found')) {
    return res.status(404).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.message.includes('already booked')) {
    return res.status(409).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (
    err.message.includes('Cannot cancel') ||
    err.message.includes('exceeded') ||
    err.message.includes('Invalid') ||
    err.message.includes('must be')
  ) {
    return res.status(400).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};