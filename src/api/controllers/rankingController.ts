import { Request, Response } from 'express';
import * as rankingModel from '../../models/RankingModel';
import { getDb } from '../../db/connection';

/**
 * Получить рейтинги игроков
 */
export async function getRankings(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const rankings = await rankingModel.getRankings(limit);
    
    // Получаем коллекцию пользователей
    const usersCollection = getDb().collection('users');
    
    // Собираем ID пользователей из рейтингов
    const userIds = rankings.map(r => r.userId);
    
    // Получаем пользователей одним запросом
    const users = await usersCollection
      .find({ telegramId: { $in: userIds } })
      .toArray();
    
    // Создаем мапу для быстрого доступа по ID
    const usersMap = new Map(users.map(u => [u.telegramId, u]));
    
    // Добавляем информацию о пользователях к рейтингам
    const rankingsWithUsers = rankings.map(r => ({
      ...r,
      user: usersMap.get(r.userId) || null
    }));
    
    res.json(rankingsWithUsers);
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
    
    // Получаем коллекцию пользователей
    const usersCollection = getDb().collection('users');
    
    // Получаем информацию о пользователе
    const user = await usersCollection.findOne({ telegramId });
    
    // Добавляем информацию о пользователе к рейтингу
    const rankingWithUser = {
      ...ranking,
      user: user || null
    };
    
    res.json(rankingWithUser);
  } catch (error) {
    console.error('Error in getUserRanking controller:', error);
    res.status(500).json({ error: 'Не удалось получить рейтинг пользователя' });
  }
}