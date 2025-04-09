import { Game } from '../models/types';
import { getBotInstance } from './botInstance';

/**
 * Отправляет уведомление о приглашении в игру
 * @param invitedPlayerId ID игрока, которого пригласили
 * @param inviterPlayerId ID игрока, который пригласил
 * @param game Информация об игре
 */
export async function sendGameInvitation(
  invitedPlayerId: number,
  inviterPlayerId: number,
  game: Game
): Promise<void> {
  try {
    const bot = getBotInstance();
    
    // Форматируем дату и время
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const formattedDate = new Date(game.scheduledTime).toLocaleDateString('ru-RU', dateOptions);
    
    // Формируем текст сообщения
    const message = `
Вас пригласили на игру! 📅

Игрок: ${game.player1Username}
Дата: ${formattedDate}

Для принятия приглашения нажмите на кнопку ниже.
    `;
    
    // Создаем клавиатуру с кнопками для принятия/отклонения
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Принять', callback_data: `accept_game:${game._id}` },
          { text: '❌ Отклонить', callback_data: `reject_game:${game._id}` }
        ]
      ]
    };
    
    // Отправляем сообщение
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
 * Отправляет уведомление о результатах игры
 * @param game Информация об игре с результатами
 */
export async function sendGameResults(game: Game): Promise<void> {
  try {
    const bot = getBotInstance();
    
    if (!game.score || !game.winnerId) {
      throw new Error('Game results are incomplete');
    }
    
    // Определяем победителя и проигравшего
    const winnerId = game.winnerId;
    const loserId = winnerId === game.player1Id ? game.player2Id : game.player1Id;
    const winnerUsername = winnerId === game.player1Id ? game.player1Username : game.player2Username;
    
    // Формируем текст сообщения для победителя
    const winnerMessage = `
🏆 Поздравляем с победой! 🏆

Результат матча:
${game.score}

Ваш рейтинг был обновлен.
    `;
    
    // Формируем текст сообщения для проигравшего
    const loserMessage = `
Результаты матча:

Победитель: ${winnerUsername}
Счет: ${game.score}

Ваш рейтинг был обновлен.
    `;
    
    // Отправляем сообщения обоим игрокам
    await Promise.all([
      bot.api.sendMessage(winnerId, winnerMessage, { parse_mode: 'HTML' }),
      bot.api.sendMessage(loserId, loserMessage, { parse_mode: 'HTML' })
    ]);
    
    console.log(`Game results notifications sent for game ${game._id}`);
  } catch (error) {
    console.error('Error sending game results notifications:', error);
    throw new Error('Failed to send game results notifications');
  }
}
