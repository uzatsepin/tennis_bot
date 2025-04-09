import { Response, Request, NextFunction } from 'express';

interface ErrorResponse {
  error: string;
  details?: any;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Отправить успешный ответ
 */
export function sendSuccess<T>(res: Response, data: T, status: number = 200): void {
  const response: SuccessResponse<T> = {
    success: true,
    data
  };
  
  res.status(status).json(response);
}

/**
 * Отправить ответ с ошибкой
 */
export function sendError(res: Response, message: string, details?: any, status: number = 500): void {
  const errorResponse: ErrorResponse = {
    error: message
  };
  
  if (details) {
    errorResponse.details = details;
  }
  
  res.status(status).json(errorResponse);
}

/**
 * Wraps async route handlers to automatically catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(error); // Pass error to Express error handling middleware
    });
  };
};