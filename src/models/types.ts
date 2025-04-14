import { ObjectId } from "mongodb";

export enum GameStatus {
  DRAFT = 'draft',
  PENDING = 'pending', // Ожидает подтверждения от оппонента
  SCHEDULED = 'scheduled', // Подтверждено обоими игроками
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected' // Отклонено оппонентом
}

export interface User {
  _id?: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  points: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  age?: number;
  height?: string;
  weight?: string;
  forehand?: string;
  leagues?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLeague {
  _id?: string;
  userId: number;
  leagueId: string;
  joinedAt: Date;
}

export interface Game {
  _id?: string;
  player1Id: number;
  player2Id: number;
  player1Username: string;
  player2Username: string;
  scheduledTime: Date;
  status: GameStatus;
  score?: string;
  winnerId?: number;
  leagueId?: string;  // ID лиги, если игра относится к конкретной лиге
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
}

export interface Ranking {
  _id?: string;
  userId: number;
  username: string;
  points: number;
  position: number;
  leagueId?: string | ObjectId;
  league: League;
  updatedAt: Date;
}

export interface GameData {
  opponentUsername?: string;
  scheduledTime?: Date;
  gameId?: string;
  score?: string;
}

export interface BotSession {
  step?: 'schedule_game_username' | 'schedule_game_time' | 'add_result_select' | 'add_result_score' | 'add_result_winner';
  gameData?: GameData;
}

// Интерфейс для часто встречающихся оппонентов
export interface OpponentStats {
  opponentId: number;
  opponentUsername: string;
  gamesCount: number;
}

export interface League {
  _id?: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface League {
  _id?: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}