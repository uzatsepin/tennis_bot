import express, { Request, Response } from 'express';
import config from '../config';
import * as userModel from '../models/UserModel';
import * as gameModel from '../models/GameModel';
import * as rankingModel from '../models/RankingModel';
import { corsMiddleware, requestLogger, errorHandler } from './middlewares';
import routes from './routes';

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
 * Получение данных статистики
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const topPlayers = await userModel.getTopPlayers(3);
    const rankings = await rankingModel.getRankings(10);
    const totalUsers = await userModel.getTotalUsersCount();
    const totalGames = await gameModel.getTotalGamesCount();
    const completedGames = await gameModel.getCompletedGamesCount();
    
    // Статистика сайта
    const stats = {
      totalUsers,
      totalGames,
      completedGames,
      topPlayers,
      rankings
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error in getStats:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
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