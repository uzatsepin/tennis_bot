import express from 'express';
import config from '../config';
import routes from './routes';
import { corsMiddleware, requestLogger, errorHandler } from './middlewares';

/**
 * Создание и настройка приложения Express
 */
export function createApp() {
  const app = express();
  
  // Настройка базовых middleware
  app.use(express.json());
  app.use(requestLogger);
  app.use(corsMiddleware);
  
  // Корневой маршрут
  app.get('/', (req, res) => {
    res.json({ message: 'Tennis Club API' });
  });
  
  // Регистрация API маршрутов
  app.use('/api', routes);
  
  // Обработка ошибок должна быть последним middleware
  app.use(errorHandler);
  
  return app;
}

/**
 * Запуск API сервера
 */
export function startApiServer() {
  const app = createApp();
  const port = config.api.port;
  
  const server = app.listen(port, () => {
    console.log(`API сервер запущен на порту ${port}`);
  });
  
  return server;
}