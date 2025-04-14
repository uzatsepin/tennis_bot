import { Collection, ObjectId } from 'mongodb';
import { getDb } from '../db/connection';
import { League, UserLeague, User } from './types';

/**
 * Получение коллекции лиг
 */
function getLeaguesCollection(): Collection<League> {
  return getDb().collection<League>('leagues');
}

/**
 * Получение коллекции связей между пользователями и лигами
 */
function getUserLeaguesCollection(): Collection<UserLeague> {
  return getDb().collection<UserLeague>('userLeagues');
}

/**
 * Создать новую лигу
 */
export async function createLeague(leagueData: Omit<League, '_id'>): Promise<League> {
  const result = await getLeaguesCollection().insertOne(leagueData);
  return { ...leagueData, _id: result.insertedId.toString() };
}

/**
 * Получить все лиги
 */
export async function getAllLeagues(): Promise<League[]> {
  return getLeaguesCollection()
    .find({})
    .sort({ name: 1 })
    .toArray();
}

/**
 * Получить лигу по ID
 */
export async function getLeagueById(leagueId: string): Promise<League | null> {
  try {
    let query = {};
    
    // Проверяем, можно ли преобразовать ID в ObjectId
    if (ObjectId.isValid(leagueId)) {
      query = { _id: new ObjectId(leagueId) };
    } else {
      // Если нет, ищем как строку
      query = { _id: leagueId };
    }
    
    return getLeaguesCollection().findOne(query);
  } catch (error) {
    console.error('Error in getLeagueById:', error);
    return null;
  }
}

/**
 * Обновить данные лиги
 */
export async function updateLeague(leagueId: string, update: Partial<League>): Promise<League | null> {
  try {
    let query = {};
    
    // Проверяем, можно ли преобразовать ID в ObjectId
    if (ObjectId.isValid(leagueId)) {
      query = { _id: new ObjectId(leagueId) };
    } else {
      // Если нет, ищем как строку
      query = { _id: leagueId };
    }
    
    const result = await getLeaguesCollection().findOneAndUpdate(
      query,
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
  } catch (error) {
    console.error('Error in updateLeague:', error);
    return null;
  }
}

/**
 * Удалить лигу
 */
export async function deleteLeague(leagueId: string): Promise<boolean> {
  try {
    let query = {};
    
    // Проверяем, можно ли преобразовать ID в ObjectId
    if (ObjectId.isValid(leagueId)) {
      query = { _id: new ObjectId(leagueId) };
    } else {
      // Если нет, ищем как строку
      query = { _id: leagueId };
    }
    
    const result = await getLeaguesCollection().deleteOne(query);
    
    // Удаляем все связи пользователей с этой лигой
    if (result.deletedCount > 0) {
      await getUserLeaguesCollection().deleteMany({ leagueId });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in deleteLeague:', error);
    return false;
  }
}

/**
 * Добавить пользователя в лигу
 */
export async function addUserToLeague(userId: number, leagueId: string): Promise<UserLeague> {
  // Проверяем, существует ли уже такая связь
  const existingLink = await getUserLeaguesCollection().findOne({ userId, leagueId });
  if (existingLink) {
    return existingLink; // Пользователь уже в лиге
  }
  
  // Создаем связь между пользователем и лигой
  const userLeague: UserLeague = {
    userId,
    leagueId,
    joinedAt: new Date()
  };
  
  const result = await getUserLeaguesCollection().insertOne(userLeague);
  
  // Обновляем список лиг в модели пользователя
  const db = getDb();
  await db.collection<User>('users').updateOne(
    { telegramId: userId },
    { $addToSet: { leagues: leagueId } }
  );
  
  return { ...userLeague, _id: result.insertedId.toString() };
}

/**
 * Удалить пользователя из лиги
 */
export async function removeUserFromLeague(userId: number, leagueId: string): Promise<boolean> {
  const result = await getUserLeaguesCollection().deleteOne({ userId, leagueId });
  
  if (result.deletedCount > 0) {
    // Обновляем список лиг пользователя
    const db = getDb();
    await db.collection<User>('users').updateOne(
      { telegramId: userId },
      { $pull: { leagues: leagueId } }
    );
    return true;
  }
  
  return false;
}

/**
 * Получить все лиги пользователя
 */
export async function getUserLeagues(userId: number): Promise<League[]> {
  // Получаем ID лиг пользователя
  const userLeagues = await getUserLeaguesCollection()
    .find({ userId })
    .toArray();
  
  if (userLeagues.length === 0) {
    return [];
  }
  
  // Получаем ID лиг
  const leagueIds = userLeagues.map(ul => ul.leagueId);
  
  // Для каждого ID создаем правильный условный объект поиска
  const query: any = { 
    $or: leagueIds.map(id => {
      if (ObjectId.isValid(id)) {
        return { _id: new ObjectId(id) };
      } else {
        return { _id: id };
      }
    })
  };

  // Если массив пустой, возвращаем пустой результат
  if (leagueIds.length === 0) {
    return [];
  }
  
  return getLeaguesCollection()
    .find(query)
    .toArray();
}

/**
 * Получить всех пользователей в лиге
 */
export async function getLeagueUsers(leagueId: string): Promise<User[]> {
  // Получаем ID пользователей в лиге
  const userLeagues = await getUserLeaguesCollection()
    .find({ leagueId })
    .toArray();
  
  if (userLeagues.length === 0) {
    return [];
  }
  
  const userIds = userLeagues.map(ul => ul.userId);
  
  // Получаем информацию о пользователях
  return getDb()
    .collection<User>('users')
    .find({ telegramId: { $in: userIds } })
    .toArray();
}