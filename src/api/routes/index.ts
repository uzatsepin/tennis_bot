import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as gameController from '../controllers/gameController';
import * as rankingController from '../controllers/rankingController';
import * as leagueController from '../controllers/leagueController';
import { asyncHandler } from '../utils/responseUtils';
import { getStats } from '../ApiService';

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
router.post('/games', asyncHandler(gameController.createGame));
router.put('/games/:id/results', asyncHandler(gameController.submitGameResults));
router.put('/games/:id/confirm', asyncHandler(gameController.confirmGame));
router.put('/games/:id/reject', asyncHandler(gameController.rejectGame));

// Маршруты для рейтингов
router.get('/rankings', asyncHandler(rankingController.getRankings));
router.get('/users/:id/ranking', asyncHandler(rankingController.getUserRanking));

//Маршрут для отримання загальної статистики
router.get('/stats', asyncHandler(getStats))

//Маршрут для отримання ліги

router.get('/leagues', asyncHandler(leagueController.getAllLeagues));
router.get('/leagues/:id', asyncHandler(leagueController.getLeagueById));
router.post('/leagues', asyncHandler(leagueController.createLeague));
router.put('/leagues/:id', asyncHandler(leagueController.updateLeague));
router.delete('/leagues/:id', asyncHandler(leagueController.deleteLeague));
router.get('/leagues/:id/users', asyncHandler(leagueController.getLeagueUsers));
router.post('/leagues/:id/users', asyncHandler(leagueController.addUserToLeague));
router.delete('/leagues/:id/users/:userId', asyncHandler(leagueController.removeUserFromLeague));
router.get('/leagues/:id/rankings', asyncHandler(leagueController.getLeagueRankings));

export default router;