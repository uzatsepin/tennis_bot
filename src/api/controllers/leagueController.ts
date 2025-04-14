import { Request, Response } from 'express';
import * as leagueModel from '../../models/LeagueModel';
import { League } from '../../models/types';

/**
 * Отримати всі ліги
 */
export async function getAllLeagues(req: Request, res: Response): Promise<void> {
  try {
    const leagues = await leagueModel.getAllLeagues();
    
    res.json(leagues);
  } catch (error) {
    console.error('Помилка у контролері getAllLeagues:', error);
    res.status(500).json({ error: 'Не вдалося отримати список ліг' });
  }
}

/**
 * Отримати лігу за ID
 */
export async function getLeagueById(req: Request, res: Response): Promise<void> {
  try {
    const leagueId = req.params.id;
    const league = await leagueModel.getLeagueById(leagueId);
    
    if (!league) {
      res.status(404).json({ error: 'Ліга не знайдена' });
      return;
    }
    
    res.json(league);
  } catch (error) {
    console.error('Помилка у контролері getLeagueById:', error);
    res.status(500).json({ error: 'Не вдалося отримати інформацію про лігу' });
  }
}

/**
 * Створити нову лігу
 */
export async function createLeague(req: Request, res: Response): Promise<void> {
  try {
    const { name, description } = req.body;
    
    // Перевіряємо наявність обов'язкових полів
    if (!name) {
      res.status(400).json({ error: 'Назва ліги є обов\'язковою' });
      return;
    }
    
    // Створюємо нову лігу
    const newLeague: Omit<League, '_id'> = {
      name,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await leagueModel.createLeague(newLeague);
    res.status(201).json(result);
  } catch (error) {
    console.error('Помилка у контролері createLeague:', error);
    res.status(500).json({ error: 'Не вдалося створити лігу' });
  }
}

/**
 * Оновити інформацію про лігу
 */
export async function updateLeague(req: Request, res: Response): Promise<void> {
  try {
    const leagueId = req.params.id;
    const { name, description } = req.body;
    
    // Перевіряємо існування ліги
    const existingLeague = await leagueModel.getLeagueById(leagueId);
    
    if (!existingLeague) {
      res.status(404).json({ error: 'Ліга не знайдена' });
      return;
    }
    
    // Підготовлюємо об'єкт для оновлення
    const updateData: Partial<League> = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    // Оновлюємо лігу
    const updatedLeague = await leagueModel.updateLeague(leagueId, updateData);
    
    res.json(updatedLeague);
  } catch (error) {
    console.error('Помилка у контролері updateLeague:', error);
    res.status(500).json({ error: 'Не вдалося оновити інформацію про лігу' });
  }
}

/**
 * Видалити лігу
 */
export async function deleteLeague(req: Request, res: Response): Promise<void> {
  try {
    const leagueId = req.params.id;
    
    // Перевіряємо існування ліги
    const existingLeague = await leagueModel.getLeagueById(leagueId);
    
    if (!existingLeague) {
      res.status(404).json({ error: 'Ліга не знайдена' });
      return;
    }
    
    // Видаляємо лігу
    const result = await leagueModel.deleteLeague(leagueId);
    
    if (result) {
      res.status(200).json({ message: 'Ліга успішно видалена' });
    } else {
      res.status(500).json({ error: 'Не вдалося видалити лігу' });
    }
  } catch (error) {
    console.error('Помилка у контролері deleteLeague:', error);
    res.status(500).json({ error: 'Не вдалося видалити лігу' });
  }
}

/**
 * Отримати користувачів у лізі
 */
export async function getLeagueUsers(req: Request, res: Response): Promise<void> {
  try {
    const leagueId = req.params.id;
    
    // Перевіряємо існування ліги
    const existingLeague = await leagueModel.getLeagueById(leagueId);
    
    if (!existingLeague) {
      res.status(404).json({ error: 'Ліга не знайдена' });
      return;
    }
    
    const users = await leagueModel.getLeagueUsers(leagueId);
    res.json(users);
  } catch (error) {
    console.error('Помилка у контролері getLeagueUsers:', error);
    res.status(500).json({ error: 'Не вдалося отримати список користувачів ліги' });
  }
}

/**
 * Додати користувача до ліги
 */
export async function addUserToLeague(req: Request, res: Response): Promise<void> {
  try {
    const leagueId = req.params.id;
    const { telegramId } = req.body;
    
    // Перевіряємо наявність обов'язкових полів
    if (!telegramId) {
      res.status(400).json({ error: 'Telegram ID користувача є обов\'язковим' });
      return;
    }
    
    // Перевіряємо існування ліги
    const existingLeague = await leagueModel.getLeagueById(leagueId);
    
    if (!existingLeague) {
      res.status(404).json({ error: 'Ліга не знайдена' });
      return;
    }
    
    // Додаємо користувача до ліги
    const result = await leagueModel.addUserToLeague(Number(telegramId), leagueId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Помилка у контролері addUserToLeague:', error);
    res.status(500).json({ error: 'Не вдалося додати користувача до ліги' });
  }
}

/**
 * Видалити користувача з ліги
 */
export async function removeUserFromLeague(req: Request, res: Response): Promise<void> {
  try {
    const leagueId = req.params.id;
    const telegramId = Number(req.params.telegramId);
    
    // Перевіряємо існування ліги
    const existingLeague = await leagueModel.getLeagueById(leagueId);
    
    if (!existingLeague) {
      res.status(404).json({ error: 'Ліга не знайдена' });
      return;
    }
    
    // Видаляємо користувача з ліги
    const result = await leagueModel.removeUserFromLeague(telegramId, leagueId);
    
    if (result) {
      res.status(200).json({ message: 'Користувача успішно видалено з ліги' });
    } else {
      res.status(404).json({ error: 'Користувача не знайдено у цій лізі' });
    }
  } catch (error) {
    console.error('Помилка у контролері removeUserFromLeague:', error);
    res.status(500).json({ error: 'Не вдалося видалити користувача з ліги' });
  }
}

/**
 * Отримати рейтинг у лізі
 */
export async function getLeagueRankings(req: Request, res: Response): Promise<void> {
  try {
    const leagueId = req.params.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    // Перевіряємо існування ліги
    const existingLeague = await leagueModel.getLeagueById(leagueId);
    
    if (!existingLeague) {
      res.status(404).json({ error: 'Ліга не знайдена' });
      return;
    }
    
    // Імпортуємо модель рейтингів
    const rankingModel = require('../../models/RankingModel');
    const rankings = await rankingModel.getLeagueRankings(leagueId, limit);
    
    res.json(rankings);
  } catch (error) {
    console.error('Помилка у контролері getLeagueRankings:', error);
    res.status(500).json({ error: 'Не вдалося отримати рейтинг ліги' });
  }
}