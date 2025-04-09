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
    
    // Получаем все игры напрямую из коллекции
    const collection = getDb().collection<Game>('games');
    
    // Формируем условия поиска, если указан статус
    const query = status ? { status: status as GameStatus } : {};
    
    const games = await collection.find(query)
                                .sort({ scheduledTime: -1 })
                                .limit(limit)
                                .toArray();
    
    res.json(games);
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