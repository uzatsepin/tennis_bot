import { Collection } from 'mongodb';
import { getDb } from '../db/connection';
import { User } from './types';

/**
 * Получение коллекции пользователей
 */
function getUsersCollection(): Collection<User> {
  return getDb().collection<User>('users');
}

/**
 * Найти пользователя по Telegram ID
 */
export async function findUserByTelegramId(telegramId: number): Promise<User | null> {
  return getUsersCollection().findOne({ telegramId });
}

/**
 * Знайти користувача за ім'ям користувача (username)
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  return getUsersCollection().findOne({ username });
}

/**
 * Создать нового пользователя
 */
export async function createUser(userData: Omit<User, '_id'>): Promise<User> {
  const result = await getUsersCollection().insertOne(userData);
  return { ...userData, _id: result.insertedId.toString() };
}

/**
 * Обновить данные пользователя
 */
export async function updateUser(telegramId: number, update: Partial<User>): Promise<User | null> {
  const result = await getUsersCollection().findOneAndUpdate(
    { telegramId },
    { $set: { ...update, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return result;
}

/**
 * Обновить статистику пользователя после игры
 */
export async function updateUserStats(userId: number, isWinner: boolean): Promise<void> {
  const numericUpdates: Record<string, number> = {
    gamesPlayed: 1
  };

  if (isWinner) {
    numericUpdates.gamesWon = 1;
    numericUpdates.points = 3;
  } else {
    numericUpdates.gamesLost = 1;
    
    // Реализация логики с очками: -3 по умолчанию, но -1 если набрал больше 30 очков
    const user = await findUserByTelegramId(userId);
    if (user && user.points > 30) {
      numericUpdates.points = -1;
    } else {
      numericUpdates.points = -3;
    }
  }

  await getUsersCollection().updateOne(
    { telegramId: userId },
    { 
      $inc: numericUpdates,
      $set: { updatedAt: new Date() }
    }
  );
}

/**
 * Получить список топ игроков по рейтингу
 */
export async function getTopPlayers(limit: number = 10): Promise<User[]> {
  return getUsersCollection()
    .find({})
    .sort({ points: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Получить общее количество зарегистрированных пользователей
 */
export async function getTotalUsersCount(): Promise<number> {
  return getUsersCollection().countDocuments();
}

/**
 * Регистрация пользователя через веб-приложение
 * В отличие от Telegram-бота, тут нет telegramId и регистрация может происходить по email/логину
 */
export async function registerWebUser(userData: {
  username: string;
  firstName: string;
  lastName?: string;
  age?: number;
  height?: number;
  weight?: number;
  forehand?: string;
}): Promise<User> {
  // Генерация временного отрицательного telegramId для веб-пользователей
  // Реальные пользователи Telegram имеют положительные ID
  const tempTelegramId = -Math.floor(Math.random() * 1000000 + 1);
  
  const now = new Date();
  const newUser: Omit<User, '_id'> = {
    telegramId: tempTelegramId,
    username: userData.username,
    firstName: userData.firstName,
    lastName: userData.lastName,
    points: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    age: userData.age,
    height: userData.height,
    weight: userData.weight,
    forehand: userData.forehand,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await getUsersCollection().insertOne(newUser);
  return { ...newUser, _id: result.insertedId.toString() };
}

/**
 * Обновление профиля пользователя с дополнительными полями
 */
export async function updateUserProfile(userId: number, profileData: {
  firstName?: string;
  lastName?: string;
  age?: number;
  height?: number;
  weight?: number;
  forehand?: string;
}): Promise<User | null> {
  const result = await getUsersCollection().findOneAndUpdate(
    { telegramId: userId },
    { 
      $set: { 
        ...profileData, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  return result;
}