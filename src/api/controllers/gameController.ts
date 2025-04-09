import { Request, Response } from 'express';
import * as gameModel from '../../models/GameModel';
import { getDb } from '../../db/connection';
import { Game, GameStatus } from '../../models/types';

/**
 * Получить все игры
 */
export async function getGames(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const status = req.query.status as string | undefined;
    
    // Получаем коллекцию игр
    const gamesCollection = getDb().collection<Game>('games');
    
    // Формируем условия поиска, если указан статус
    const matchStage = status ? { $match: { status: status as GameStatus } } : { $match: {} };
    
    // Создаем pipeline для агрегации
    const pipeline = [
      matchStage,
      { $sort: { scheduledTime: -1 } },
      { $limit: limit },
      // Lookup для player1
      {
        $lookup: {
          from: 'users',
          localField: 'player1Id',
          foreignField: 'telegramId',
          as: 'player1'
        }
      },
      // Lookup для player2
      {
        $lookup: {
          from: 'users',
          localField: 'player2Id',
          foreignField: 'telegramId',
          as: 'player2'
        }
      },
      // Преобразуем массивы в объекты (берем первый и единственный элемент)
      {
        $addFields: {
          player1: { $arrayElemAt: ['$player1', 0] },
          player2: { $arrayElemAt: ['$player2', 0] }
        }
      }
    ];
    
    const gamesWithUsers = await gamesCollection.aggregate(pipeline).toArray();
    
    res.json(gamesWithUsers);
  } catch (error) {
    console.error('Error in getGames controller:', error);
    res.status(500).json({ error: 'Не удалось получить игры' });
  }
}

/**
 * Получить игру по ID
 */
export async function getGameById(req: Request, res: Response): Promise<void> {
  try {
    const gameId = req.params.id;
    const game = await gameModel.getGameById(gameId);
    
    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error in getGameById controller:', error);
    res.status(500).json({ error: 'Не удалось получить игру' });
  }
}

/**
 * Получить игры пользователя
 */
export async function getUserGames(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = Number(req.params.id);
    const games = await gameModel.getUserGames(telegramId);
    
    res.json(games);
  } catch (error) {
    console.error('Error in getUserGames controller:', error);
    res.status(500).json({ error: 'Не удалось получить игры пользователя' });
  }
}

/**
 * Получить количество игр
 */
export async function getGamesCount(req: Request, res: Response): Promise<void> {
  try {
    const total = await gameModel.getTotalGamesCount();
    const completed = await gameModel.getCompletedGamesCount();
    
    res.json({ total, completed });
  } catch (error) {
    console.error('Error in getGamesCount controller:', error);
    res.status(500).json({ error: 'Не удалось получить количество игр' });
  }
}