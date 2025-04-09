import { Request, Response } from 'express';
import * as rankingModel from '../../models/RankingModel';

/**
 * Получить рейтинги игроков
 */
export async function getRankings(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const rankings = await rankingModel.getRankings(limit);
    
    res.json(rankings);
  } catch (error) {
    console.error('Error in getRankings controller:', error);
    res.status(500).json({ error: 'Не удалось получить рейтинги' });
  }
}

/**
 * Получить рейтинг пользователя
 */
export async function getUserRanking(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = Number(req.params.id);
    const ranking = await rankingModel.getUserRanking(telegramId);
    
    if (!ranking) {
      res.status(404).json({ error: 'Рейтинг для данного пользователя не найден' });
      return;
    }
    
    res.json(ranking);
  } catch (error) {
    console.error('Error in getUserRanking controller:', error);
    res.status(500).json({ error: 'Не удалось получить рейтинг пользователя' });
  }
}