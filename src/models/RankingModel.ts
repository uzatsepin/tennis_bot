import { Collection } from 'mongodb';
import { getDb } from '../db/connection';
import { Ranking } from './types';
import * as userModel from './UserModel';

/**
 * Получение коллекции рейтингов
 */
function getRankingsCollection(): Collection<Ranking> {
  return getDb().collection<Ranking>('rankings');
}

/**
 * Получить полный рейтинг
 */
export async function getRankings(limit: number = 10): Promise<Ranking[]> {
  return getRankingsCollection()
    .find({})
    .sort({ points: -1, updatedAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Получить рейтинг конкретного пользователя
 */
export async function getUserRanking(userId: number): Promise<Ranking | null> {
  return getRankingsCollection().findOne({ userId });
}

/**
 * Обновить рейтинги всех пользователей
 */
export async function updateRankings(): Promise<void> {
  // Получаем всех пользователей, отсортированных по очкам
  const users = await userModel.getTopPlayers(100);
  
  // Обновляем рейтинг для каждого пользователя
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const position = i + 1; // позиция в рейтинге (начинается с 1)
    
    // Обновляем или создаем запись рейтинга
    await getRankingsCollection().updateOne(
      { userId: user.telegramId },
      { 
        $set: {
          userId: user.telegramId,
          username: user.username,
          points: user.points,
          position,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  }
}