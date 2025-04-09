import { Request, Response } from 'express';
import * as userModel from '../../models/UserModel';

/**
 * Получить всех пользователей
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const users = await userModel.getTopPlayers(limit);
    res.json(users);
  } catch (error) {
    console.error('Error in getUsers controller:', error);
    res.status(500).json({ error: 'Не удалось получить пользователей' });
  }
}

/**
 * Получить пользователя по ID
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = Number(req.params.id);
    const user = await userModel.findUserByTelegramId(telegramId);
    
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error in getUserById controller:', error);
    res.status(500).json({ error: 'Не удалось получить пользователя' });
  }
}

/**
 * Получить общее количество пользователей
 */
export async function getUsersCount(req: Request, res: Response): Promise<void> {
  try {
    const count = await userModel.getTotalUsersCount();
    res.json({ count });
  } catch (error) {
    console.error('Error in getUsersCount controller:', error);
    res.status(500).json({ error: 'Не удалось получить количество пользователей' });
  }
}

/**
 * Регистрация нового пользователя через web-приложение
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, firstName, lastName, age, height, weight, forehand } = req.body;
    
    // Проверка обязательных полей
    if (!username || !firstName) {
      res.status(400).json({ error: 'Поля username и firstName обязательны' });
      return;
    }
    
    // Проверка уникальности username
    const existingUser = await userModel.findUserByUsername(username);
    if (existingUser) {
      res.status(409).json({ error: 'Пользователь с таким username уже существует' });
      return;
    }
    
    // Регистрация пользователя
    const user = await userModel.registerWebUser({
      username,
      firstName,
      lastName,
      age,
      height,
      weight,
      forehand
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Error in registerUser controller:', error);
    res.status(500).json({ error: 'Не удалось зарегистрировать пользователя' });
  }
}

/**
 * Обновление профиля пользователя
 */
export async function updateUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);
    const { firstName, lastName, age, height, weight, forehand } = req.body;
    
    // Проверка существования пользователя
    const user = await userModel.findUserByTelegramId(userId);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    
    // Обновление профиля пользователя
    const updatedUser = await userModel.updateUserProfile(userId, {
      firstName,
      lastName,
      age,
      height,
      weight,
      forehand
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error in updateUserProfile controller:', error);
    res.status(500).json({ error: 'Не удалось обновить профиль пользователя' });
  }
}