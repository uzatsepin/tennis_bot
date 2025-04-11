import { Game } from '../models/types';
import { getBotInstance } from './botInstance';
import { createMainMenuKeyboard } from './keyboards';

/**
 * Відправляє сповіщення про запрошення до гри
 * @param invitedPlayerId ID гравця, якого запросили
 * @param inviterPlayerId ID гравця, який запросив
 * @param game Інформація про гру
 */
export async function sendGameInvitation(
  invitedPlayerId: number,
  inviterPlayerId: number,
  game: Game
): Promise<void> {
  try {
    const bot = getBotInstance();
    
    // Форматуємо дату та час
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const formattedDate = new Date(game.scheduledTime).toLocaleDateString('uk-UA', dateOptions);
    
    // Формуємо текст повідомлення
    const message = `
🎾 Вас запросили на гру! 📅

👤 Гравець: ${game.player1Username}
🗓️ Дата: ${formattedDate}

Для прийняття запрошення натисніть на кнопку нижче.
    `;
    
    // Створюємо клавіатуру з кнопками для прийняття/відхилення
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Прийняти', callback_data: `confirm_game:${game._id}` },
          { text: '❌ Відхилити', callback_data: `reject_game:${game._id}` }
        ]
      ]
    };
    
    // Відправляємо повідомлення
    await bot.api.sendMessage(invitedPlayerId, message, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    
    console.log(`Game invitation sent to player ${invitedPlayerId}`);
  } catch (error) {
    console.error('Error sending game invitation:', error);
    throw new Error('Failed to send game invitation');
  }
}

/**
 * Відправляє сповіщення про результати гри
 * @param game Інформація про гру з результатами
 */
export async function sendGameResults(game: Game): Promise<void> {
  try {
    const bot = getBotInstance();
    
    if (!game.score || !game.winnerId) {
      throw new Error('Game results are incomplete');
    }
    
    // Визначаємо переможця та переможеного
    const winnerId = game.winnerId;
    const loserId = winnerId === game.player1Id ? game.player2Id : game.player1Id;
    const winnerUsername = winnerId === game.player1Id ? game.player1Username : game.player2Username;
    
    // Формуємо текст повідомлення для переможця
    const winnerMessage = `
🏆 Вітаємо з перемогою! 🎉

📊 Результат матчу:
${game.score}

📈 Ваш рейтинг було оновлено.
    `;
    
    // Формуємо текст повідомлення для переможеного
    const loserMessage = `
🎾 Результати матчу:

🥇 Переможець: ${winnerUsername}
📊 Рахунок: ${game.score}

📈 Ваш рейтинг було оновлено.
    `;
    
    // Відправляємо повідомлення обом гравцям
    await Promise.all([
      bot.api.sendMessage(winnerId, winnerMessage, { parse_mode: 'HTML', reply_markup: createMainMenuKeyboard() }),
      bot.api.sendMessage(loserId, loserMessage, { parse_mode: 'HTML', reply_markup: createMainMenuKeyboard() })
    ]);
    
    console.log(`Game results notifications sent for game ${game._id}`);
  } catch (error) {
    console.error('Error sending game results notifications:', error);
    throw new Error('Failed to send game results notifications');
  }
}
