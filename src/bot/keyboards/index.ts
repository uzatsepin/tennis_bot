import { InlineKeyboard } from 'grammy';
import type { Game } from '../../models/types';

/**
 * Створити клавіатуру головного меню
 */
export function createMainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🎾 Запланувати гру', 'schedule_game')
    .text('📊 Додати результат', 'add_result').row()
    .text('📈 Моя статистика', 'my_stats')
    .text('🏆 Рейтинг', 'rankings').row()
    .text('🗓️ Мої ігри', 'my_games');
}

/**
 * Створити клавіатуру з кнопкою повернення до головного меню
 */
export function createBackToMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('🔙 Назад до меню', 'main_menu');
}

/**
 * Створити клавіатуру вибору гри для додавання результату
 */
export function createSelectGameKeyboard(games: Game[], userId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  for (const game of games) {
    const opponent = game.player1Id === userId ? game.player2Username : game.player1Username;
    const date = new Date(game.scheduledTime).toLocaleDateString();
    keyboard.text(`🎮 ${opponent} - ${date}`, `game_select:${game._id}`).row();
  }
  
  keyboard.text('🔙 Назад до меню', 'main_menu');
  
  return keyboard;
}

/**
 * Створити клавіатуру для вибору переможця
 */
export function createSelectWinnerKeyboard(game: Game): InlineKeyboard {
  return new InlineKeyboard()
    .text(`🥇 ${game.player1Username} переміг`, `winner_select:${game.player1Id}`).row()
    .text(`🥇 ${game.player2Username} переміг`, `winner_select:${game.player2Id}`).row()
    .text('❌ Скасувати', 'main_menu');
}

/**
 * Створити клавіатуру для відображення ігор користувача за статусом
 */
export function createMyGamesKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔄 Заплановані ігри', 'my_games_scheduled')
    .text('✅ Зіграні ігри', 'my_games_completed').row()
    .text('⏳ Очікують підтвердження', 'my_games_pending').row()
    .text('🔙 Назад до меню', 'main_menu');
}