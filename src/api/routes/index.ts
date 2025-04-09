import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as gameController from '../controllers/gameController';
import * as rankingController from '../controllers/rankingController';
import { asyncHandler } from '../utils/responseUtils';

const router = Router();

// Маршруты для пользователей
router.get('/users', asyncHandler(userController.getUsers));
router.get('/users/count', asyncHandler(userController.getUsersCount));
router.get('/users/:id', asyncHandler(userController.getUserById));
// Новые маршруты для веб-приложения
router.post('/users/register', asyncHandler(userController.registerUser));
router.put('/users/:id/profile', asyncHandler(userController.updateUserProfile));

// Маршруты для игр
router.get('/games', asyncHandler(gameController.getGames));
router.get('/games/count', asyncHandler(gameController.getGamesCount));
router.get('/games/:id', asyncHandler(gameController.getGameById));
router.get('/users/:id/games', asyncHandler(gameController.getUserGames));

// Маршруты для рейтингов
router.get('/rankings', asyncHandler(rankingController.getRankings));
router.get('/users/:id/ranking', asyncHandler(rankingController.getUserRanking));

export default router;