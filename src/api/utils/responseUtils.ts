import { Response } from 'express';

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
 * Обработчик ошибок для асинхронных middleware
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('API Error:', err);
      sendError(res, 'Внутренняя ошибка сервера', process.env.NODE_ENV === 'development' ? err.stack : undefined);
    });
  };
}