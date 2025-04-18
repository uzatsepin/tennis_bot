import { Request, Response } from 'express';
import * as gameModel from '../../models/GameModel';
import { getDb } from '../../db/connection';
import { Game, GameStatus } from '../../models/types';
import { sendGameInvitation, sendGameResults } from '../../bot/notifications';

/**
 * Получить все игры
 */
export async function getGames(req: Request, res: Response): Promise<void> {
  try {
    // Определяем параметры пагинации с значениями по умолчанию
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const status = req.query.status as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    
    // Вычисляем смещение для пагинации
    const skip = (page - 1) * limit;
    
    // Получаем коллекцию игр
    const gamesCollection = getDb().collection<Game>('games');
    
    // Формируем условия поиска с учетом статуса и дат
    let matchConditions: any = {};
    
    if (status) {
      matchConditions.status = status as GameStatus;
    }
    
    // Добавляем фильтрацию по диапазону дат, если указаны даты
    if (fromDate || toDate) {
      matchConditions.scheduledTime = {};
      
      if (fromDate) {
        matchConditions.scheduledTime.$gte = new Date(fromDate);
      }
      
      if (toDate) {
        matchConditions.scheduledTime.$lte = new Date(toDate);
      }
    }
    
    const matchStage = { $match: matchConditions };
    
    // Создаем pipeline для агрегации
    const pipeline = [
      matchStage,
      { $sort: { scheduledTime: -1 } },
      { $skip: skip },
      { $limit: limit },
      // Lookup для player1
      {
        $lookup: {
          from: 'users',
          localField: 'player1Id',
          foreignField: 'telegramId',
          as: 'player1'
        }
      },
      // Lookup для player2
      {
        $lookup: {
          from: 'users',
          localField: 'player2Id',
          foreignField: 'telegramId',
          as: 'player2'
        }
      },
      // Преобразуем массивы в объекты (берем первый и единственный элемент)
      {
        $addFields: {
          player1: { $arrayElemAt: ['$player1', 0] },
          player2: { $arrayElemAt: ['$player2', 0] }
        }
      }
    ];
    
    // Получаем игры для текущей страницы
    const gamesWithUsers = await gamesCollection.aggregate(pipeline).toArray();
    
    // Получаем общее количество игр для метаданных пагинации
    const countPipeline = [
      matchStage,
      { $count: "total" }
    ];
    const totalResults = await gamesCollection.aggregate(countPipeline).toArray();
    const total = totalResults.length > 0 ? totalResults[0].total : 0;
    
    // Формируем ответ с данными пагинации
    res.json({
      games: gamesWithUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error in getGames controller:', error);
    res.status(500).json({ error: 'Не удалось получить игры' });
  }
}

/**
 * Получить игру по ID
 */
export async function getGameById(req: Request, res: Response): Promise<void> {
  try {
    const gameId = req.params.id;
    const game = await gameModel.getGameById(gameId);
    
    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error in getGameById controller:', error);
    res.status(500).json({ error: 'Не удалось получить игру' });
  }
}

/**
 * Получить игры пользователя
 */
export async function getUserGames(req: Request, res: Response): Promise<void> {
  try {
    const telegramId = Number(req.params.id);
    const status = req.query.status as GameStatus | undefined;
    
    const games = await gameModel.getUserGames(telegramId, status);
    
    res.json(games);
  } catch (error) {
    console.error('Error in getUserGames controller:', error);
    res.status(500).json({ error: 'Не удалось получить игры пользователя' });
  }
}

/**
 * Создать игру
 */
export async function createGame(req: Request, res: Response): Promise<void> {
  try {
    const { player1Id, player2Id, scheduledTime } = req.body;
    console.log('Creating game with data:', req.body);
    
    
    // Проверка наличия обязательных полей
    if (!player1Id || !player2Id || !scheduledTime) {
      res.status(400).json({ error: 'Отсутствуют обязательные поля' });
      return;
    }
    
    // Проверка существования игроков
    const db = getDb();
    const usersCollection = db.collection('users');
    
    const player1 = await usersCollection.findOne({ telegramId: Number(player1Id) });
    const player2 = await usersCollection.findOne({ telegramId: Number(player2Id) });
    
    if (!player1 || !player2) {
      res.status(404).json({ error: 'Один или оба игрока не найдены' });
      return;
    }
    
    // Создание новой игры
    const newGame: Omit<Game, '_id'> = {
      player1Id: Number(player1Id),
      player2Id: Number(player2Id),
      player1Username: player1.username,
      player2Username: player2.username,
      scheduledTime: new Date(scheduledTime),
      status: GameStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: Number(player1Id)
    };
    
    const result = await gameModel.createGame(newGame);
    
    // Отправка уведомления приглашенному игроку
    await sendGameInvitation(Number(player2Id), Number(player1Id), result);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createGame controller:', error);
    res.status(500).json({ error: 'Не удалось создать игру' });
  }
}

/**
 * Ввод результатов игры
 */
export async function submitGameResults(req: Request, res: Response): Promise<void> {
  try {
    const gameId = req.params.id;
    const { score, winnerId } = req.body;
    
    // Проверка наличия обязательных полей
    if (!score || !winnerId) {
      res.status(400).json({ error: 'Отсутствуют обязательные поля' });
      return;
    }
    
    // Получение игры
    const game = await gameModel.getGameById(gameId);
    
    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }
    
    // Проверка статуса игры
    if (game.status !== GameStatus.SCHEDULED) {
      res.status(400).json({ error: 'Результаты можно вводить только для запланированных игр' });
      return;
    }
    
    // Проверка, что winnerId это один из игроков
    if (Number(winnerId) !== game.player1Id && Number(winnerId) !== game.player2Id) {
      res.status(400).json({ error: 'Победитель должен быть одним из игроков' });
      return;
    }
    
    // Обновление игры
    const updatedGame = await gameModel.updateGameResults(gameId, {
      score,
      winnerId: Number(winnerId),
      status: GameStatus.COMPLETED
    });
    
    // Отправка уведомлений о результатах
    await sendGameResults(updatedGame);
    
    res.json(updatedGame);
  } catch (error) {
    console.error('Error in submitGameResults controller:', error);
    res.status(500).json({ error: 'Не удалось обновить результаты игры' });
  }
}

/**
 * Подтвердить игру
 */
export async function confirmGame(req: Request, res: Response): Promise<void> {
  try {
    const gameId = req.params.id;
    const { userId } = req.body; // ID пользователя, который подтверждает игру
    
    // Получаем игру
    const game = await gameModel.getGameById(gameId);
    
    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }
    
    // Проверяем, что игра в статусе PENDING
    if (game.status !== GameStatus.PENDING) {
      res.status(400).json({ error: 'Игра не находится в статусе ожидания подтверждения' });
      return;
    }
    
    // Проверяем, что запрос отправлен вторым игроком
    if (Number(userId) !== game.player2Id) {
      res.status(403).json({ error: 'Только приглашенный игрок может подтвердить игру' });
      return;
    }
    
    // Обновляем статус игры на SCHEDULED
    const updatedGame = await gameModel.updateGameStatus(gameId, GameStatus.SCHEDULED);
    
    res.json(updatedGame);
  } catch (error) {
    console.error('Error in confirmGame controller:', error);
    res.status(500).json({ error: 'Не удалось подтвердить игру' });
  }
}

/**
 * Отклонить игру
 */
export async function rejectGame(req: Request, res: Response): Promise<void> {
  try {
    const gameId = req.params.id;
    const { userId } = req.body; // ID пользователя, который отклоняет игру
    
    // Получаем игру
    const game = await gameModel.getGameById(gameId);
    
    if (!game) {
      res.status(404).json({ error: 'Игра не найдена' });
      return;
    }
    
    // Проверяем, что игра в статусе PENDING
    if (game.status !== GameStatus.PENDING) {
      res.status(400).json({ error: 'Игра не находится в статусе ожидания подтверждения' });
      return;
    }
    
    // Проверяем, что запрос отправлен вторым игроком
    if (Number(userId) !== game.player2Id) {
      res.status(403).json({ error: 'Только приглашенный игрок может отклонить игру' });
      return;
    }
    
    // Обновляем статус игры на REJECTED
    const updatedGame = await gameModel.updateGameStatus(gameId, GameStatus.REJECTED);
    
    res.json(updatedGame);
  } catch (error) {
    console.error('Error in rejectGame controller:', error);
    res.status(500).json({ error: 'Не удалось отклонить игру' });
  }
}

/**
 * Получить количество игр
 */
export async function getGamesCount(req: Request, res: Response): Promise<void> {
  try {
    const total = await gameModel.getTotalGamesCount();
    const completed = await gameModel.getCompletedGamesCount();
    
    res.json({ total, completed });
  } catch (error) {
    console.error('Error in getGamesCount controller:', error);
    res.status(500).json({ error: 'Не удалось получить количество игр' });
  }
}