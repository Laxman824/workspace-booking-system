import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const rateLimit = (options: { windowMs: number; max: number }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }
    
    // Initialize or increment
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
    } else {
      store[key].count++;
    }
    
    // Check limit
    if (store[key].count > options.max) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Please try again after ${Math.ceil((store[key].resetTime - now) / 1000)} seconds`,
      });
    }
    
    // Add headers
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - store[key].count));
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());
    
    next();
  };
};