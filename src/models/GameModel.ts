import { Collection, ObjectId } from 'mongodb';
import { getDb } from '../db/connection';
import { Game, GameStatus, OpponentStats } from './types';

/**
 * Получение коллекции игр
 */
function getGamesCollection(): Collection<Game> {
  return getDb().collection<Game>('games');
}

/**
 * Создать новую игру
 */
export async function createGame(gameData: Omit<Game, '_id'>): Promise<Game> {
  const result = await getGamesCollection().insertOne(gameData);
  return { ...gameData, _id: result.insertedId.toString() };
}

/**
 * Получить игру по ID
 */
export async function getGameById(gameId: string): Promise<Game | null> {
  try {
    let query = {};
    
    // Проверяем, можно ли преобразовать ID в ObjectId
    if (ObjectId.isValid(gameId)) {
      query = { _id: new ObjectId(gameId) };
    } else {
      // Если нет, ищем как строку
      query = { _id: gameId };
    }
    
    return getGamesCollection().findOne(query);
  } catch (error) {
    console.error('Error in getGameById:', error);
    return null;
  }
}

/**
 * Обновить данные игры
 */
export async function updateGame(gameId: string, update: Partial<Game>): Promise<Game | null> {
  try {
    let query = {};
    
    // Проверяем, можно ли преобразовать ID в ObjectId
    if (ObjectId.isValid(gameId)) {
      query = { _id: new ObjectId(gameId) };
    } else {
      // Если нет, ищем как строку
      query = { _id: gameId };
    }
    
    const result = await getGamesCollection().findOneAndUpdate(
      query,
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
  } catch (error) {
    console.error('Error in updateGame:', error);
    return null;
  }
}

/**
 * Получить все игры пользователя
 */
export async function getUserGames(userId: number): Promise<Game[]> {
  return getGamesCollection().find({
    $or: [
      { player1Id: userId },
      { player2Id: userId }
    ]
  }).sort({ scheduledTime: -1 }).toArray();
}

/**
 * Получить незавершенные игры пользователя
 */
export async function getUserPendingGames(userId: number): Promise<Game[]> {
  return getGamesCollection().find({
    $or: [
      { player1Id: userId },
      { player2Id: userId }
    ],
    status: { $in: [GameStatus.DRAFT, GameStatus.PENDING, GameStatus.SCHEDULED] }
  }).sort({ scheduledTime: 1 }).toArray();
}

/**
 * Получить завершенные игры пользователя
 */
export async function getUserCompletedGames(userId: number, limit: number = 10): Promise<Game[]> {
  return getGamesCollection().find({
    $or: [
      { player1Id: userId },
      { player2Id: userId }
    ],
    status: GameStatus.COMPLETED
  }).sort({ scheduledTime: -1 }).limit(limit).toArray();
}

/**
 * Получить самых частых оппонентов пользователя
 */
export async function getMostFrequentOpponents(userId: number, limit: number = 5): Promise<OpponentStats[]> {
  const pipeline = [
    {
      $match: {
        $or: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        status: GameStatus.COMPLETED
      }
    },
    {
      $project: {
        opponentId: {
          $cond: {
            if: { $eq: ["$player1Id", userId] },
            then: "$player2Id",
            else: "$player1Id"
          }
        },
        opponentUsername: {
          $cond: {
            if: { $eq: ["$player1Id", userId] },
            then: "$player2Username",
            else: "$player1Username"
          }
        }
      }
    },
    {
      $group: {
        _id: "$opponentId",
        opponentId: { $first: "$opponentId" },
        opponentUsername: { $first: "$opponentUsername" },
        gamesCount: { $sum: 1 }
      }
    },
    {
      $sort: { gamesCount: -1 }
    },
    {
      $limit: limit
    }
  ];

  return getGamesCollection().aggregate(pipeline).toArray() as unknown as Promise<OpponentStats[]>;
}

/**
 * Получить последнюю игру пользователя
 */
export async function getLastGame(userId: number): Promise<Game | null> {
  const games = await getGamesCollection().find({
    $or: [
      { player1Id: userId },
      { player2Id: userId }
    ],
    status: GameStatus.COMPLETED
  }).sort({ scheduledTime: -1 }).limit(1).toArray();

  return games.length > 0 ? games[0] : null;
}

/**
 * Получить общее количество игр
 */
export async function getTotalGamesCount(): Promise<number> {
  return getGamesCollection().countDocuments();
}

/**
 * Получить количество завершенных игр
 */
export async function getCompletedGamesCount(): Promise<number> {
  return getGamesCollection().countDocuments({ status: GameStatus.COMPLETED });
}