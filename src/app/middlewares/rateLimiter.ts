import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../helpers/ApiError';

// Simple in-memory store for rate limiting
const requestStore: Record<string, { count: number; resetTime: number }> = {};

// Rate limit configuration
const MAX_REQUESTS = 2; // Maximum requests allowed
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

export const rateLimiter = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = req.body.email || req.query.email || 'unknown';
  const key = `${ip}:${email}`;
  const now = Date.now();

  // Initialize or reset if window expired
  if (!requestStore[key] || now > requestStore[key].resetTime) {
    requestStore[key] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    return next();
  }

  // Increment count if within window
  if (requestStore[key].count < MAX_REQUESTS) {
    requestStore[key].count++;
    return next();
  }

  // Rate limit exceeded
  const resetTime = new Date(requestStore[key].resetTime);
  throw new ApiError(
    StatusCodes.TOO_MANY_REQUESTS,
    `Rate limit exceeded. Try again after ${resetTime.toLocaleTimeString()}`,
  );
};

// Cleanup function to prevent memory leaks (run periodically)
setInterval(() => {
  const now = Date.now();
  Object.keys(requestStore).forEach((key) => {
    if (now > requestStore[key].resetTime) {
      delete requestStore[key];
    }
  });
}, WINDOW_MS);
