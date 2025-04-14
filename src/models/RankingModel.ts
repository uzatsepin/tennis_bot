import { Collection, ObjectId } from 'mongodb';
import { getDb } from '../db/connection';
import { Ranking } from './types';
import * as userModel from './UserModel';
import * as leagueModel from './LeagueModel';

/**
 * Получение коллекции рейтингов
 */
function getRankingsCollection(): Collection<Ranking> {
  return getDb().collection<Ranking>('rankings');
}

/**
 * Получить общий рейтинг (без привязки к лиге)
 */
export async function getGlobalRankings(limit: number = 10): Promise<Ranking[]> {
  const pipeline = [
    { $match: { leagueId: { $exists: false } } },
    { $sort: { points: -1, updatedAt: -1 } },
    { $limit: limit }
  ];
  
  return getRankingsCollection().aggregate(pipeline).toArray() as Promise<Ranking[]>;
}

/**
 * Получить рейтинг для конкретной лиги
 */
export async function getLeagueRankings(leagueId: string, limit: number = 10): Promise<Ranking[]> {
  const pipeline = [
    { $match: { leagueId } },
    { $sort: { points: -1, updatedAt: -1 } },
    { $limit: limit },
    // Добавляем информацию о лиге
    {
      $lookup: {
        from: 'leagues',
        localField: 'leagueId',
        foreignField: '_id',
        as: 'leagueInfo'
      }
    },
    {
      $addFields: {
        league: { $arrayElemAt: ['$leagueInfo', 0] }
      }
    },
    {
      $project: {
        leagueInfo: 0 // Удаляем временное поле
      }
    }
  ];
  
  return getRankingsCollection().aggregate(pipeline).toArray() as Promise<Ranking[]>;
}

/**
 * Получить рейтинг конкретного пользователя (глобальный или в конкретной лиге)
 */
export async function getUserRanking(userId: number, leagueId?: string): Promise<Ranking | null> {
  const query: any = { userId };
  
  if (leagueId) {
    query.leagueId = leagueId;
  } else {
    query.leagueId = { $exists: false }; // Глобальный рейтинг
  }
  
  return getRankingsCollection().findOne(query);
}

/**
 * Обновить глобальные рейтинги всех пользователей
 */
export async function updateGlobalRankings(): Promise<void> {
  // Получаем всех пользователей, отсортированных по очкам
  const users = await userModel.getTopPlayers(100);
  
  // Обновляем рейтинг для каждого пользователя
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const position = i + 1; // позиция в рейтинге (начинается с 1)
    
    // Обновляем или создаем запись глобального рейтинга
    await getRankingsCollection().updateOne(
      { userId: user.telegramId, leagueId: { $exists: false } },
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

/**
 * Обновить рейтинги пользователей в конкретной лиге
 */
export async function updateLeagueRankings(leagueId: string): Promise<void> {
  try {
    // Получаем пользователей лиги
    const leagueUsers = await leagueModel.getLeagueUsers(leagueId);
    
    if (leagueUsers.length === 0) {
      return; // Нет пользователей в лиге
    }
    
    // Сортируем пользователей по очкам
    leagueUsers.sort((a, b) => b.points - a.points);
    
    // ID лиги может быть строкой или ObjectId
    const leagueIdForDb = ObjectId.isValid(leagueId) ? new ObjectId(leagueId) : leagueId;
    
    // Обновляем рейтинг для каждого пользователя в лиге
    for (let i = 0; i < leagueUsers.length; i++) {
      const user = leagueUsers[i];
      const position = i + 1; // позиция в рейтинге лиги
      
      // Обновляем или создаем запись рейтинга в лиге
      await getRankingsCollection().updateOne(
        { userId: user.telegramId, leagueId: leagueIdForDb },
        { 
          $set: {
            userId: user.telegramId,
            username: user.username,
            points: user.points,
            position,
            leagueId: leagueIdForDb,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error('Error in updateLeagueRankings:', error);
  }
}

/**
 * Обновить все рейтинги (глобальный и по всем лигам)
 */
export async function updateAllRankings(): Promise<void> {
  // Обновляем глобальные рейтинги
  await updateGlobalRankings();
  
  // Получаем все лиги и обновляем их рейтинги
  const leagues = await leagueModel.getAllLeagues();
  for (const league of leagues) {
    if (league._id) {
      await updateLeagueRankings(league._id);
    }
  }
}