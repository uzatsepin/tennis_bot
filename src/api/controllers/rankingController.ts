import { Request, Response } from 'express';
import * as rankingModel from '../../models/RankingModel';
import * as userModel from '../../models/UserModel';
import * as leagueModel from '../../models/LeagueModel';
import { getDb } from '../../db/connection';
import { Game } from '../../models/types';

/**
 * Получить рейтинги игроков
 */
export async function getRankings(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const rankings = await rankingModel.getGlobalRankings(limit);
    
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

/**
 * Обновить рейтинги после игры
 */
export async function updateRankingsAfterGame(
  player1Id: number,
  player2Id: number,
  winnerId: number,
  game?: Game
): Promise<void> {
  try {
    // Обновляем статистику игроков
    await userModel.updateUserStats(player1Id, winnerId === player1Id);
    await userModel.updateUserStats(player2Id, winnerId === player2Id);
    
    // Обновляем глобальные рейтинги
    await rankingModel.updateGlobalRankings();
    
    // Если у нас есть информация об игре, и она связана с какой-то лигой,
    // обновляем рейтинг в этой лиге
    if (game && game.leagueId) {
      await rankingModel.updateLeagueRankings(game.leagueId);
    } else {
      // Найдем общие лиги обоих игроков и обновим в них рейтинги
      const player1Leagues = await leagueModel.getUserLeagues(player1Id);
      const player2Leagues = await leagueModel.getUserLeagues(player2Id);
      
      // Находим пересечение лиг
      const player1LeagueIds = player1Leagues.map(l => l._id).filter(id => id !== undefined) as string[];
      const player2LeagueIds = player2Leagues.map(l => l._id).filter(id => id !== undefined) as string[];
      
      const commonLeagueIds = player1LeagueIds.filter(id => player2LeagueIds.includes(id));
      
      // Обновляем рейтинги в общих лигах
      for (const leagueId of commonLeagueIds) {
        await rankingModel.updateLeagueRankings(leagueId);
      }
    }
  } catch (error) {
    console.error('Error updating rankings after game:', error);
  }
}