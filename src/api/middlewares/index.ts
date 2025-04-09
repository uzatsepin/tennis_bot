import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для CORS
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Разрешаем запросы с любого источника
  res.header('Access-Control-Allow-Origin', '*');
  
  // Разрешаем нужные заголовки
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token');
  
  // Разрешаем заголовки, используемые в ответах
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Total-Count');
  
  // Разрешаем куки в кросс-доменных запросах
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Обработка предварительных запросов OPTIONS
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    // Устанавливаем время кеширования предварительных запросов в 24 часа
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).json({});
    return;
  }
  
  next();
}

/**
 * Middleware для логирования запросов
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

/**
 * Middleware для обработки ошибок
 */
export function errorHandler(err: Error, req: Request, res: Response): void {
  console.error('API Error:', err);
  
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}