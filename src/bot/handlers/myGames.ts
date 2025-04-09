import { Context } from 'grammy';
import { GameStatus } from '../../models/types';
import * as GameModel from '../../models/GameModel';
import { createBackToMenuKeyboard, createMyGamesKeyboard } from '../keyboards';
import { formatDate } from '../../utils/formatters';

// Handler for the main "My Games" button
export async function handleMyGames(ctx: Context) {
  try {
    await ctx.reply('Оберіть категорію ігор:', {
      reply_markup: createMyGamesKeyboard()
    });
  } catch (error) {
    console.error('Error in handleMyGames:', error);
    await ctx.reply('Сталася помилка при отриманні даних про ігри.');
  }
}

// Handler for scheduled games
export async function handleMyGamesScheduled(ctx: Context) {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    // Get all user games and filter scheduled ones
    const allGames = await GameModel.getUserGames(userId);
    const scheduledGames = allGames.filter(game => game.status === GameStatus.SCHEDULED)
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    if (scheduledGames.length === 0) {
      return ctx.editMessageText('У вас немає запланованих ігор.', {
        reply_markup: createBackToMenuKeyboard()
      });
    }

    let message = '🔄 *Ваші заплановані ігри:*\n\n';
    
    scheduledGames.forEach((game, index) => {
      const opponent = game.player1Id === userId ? game.player2Username : game.player1Username;
      const date = formatDate(game.scheduledTime);
      message += `${index + 1}. Гра з *${opponent}*\n📅 ${date}\n\n`;
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: createBackToMenuKeyboard()
    });
  } catch (error) {
    console.error('Error in handleMyGamesScheduled:', error);
    await ctx.reply('Сталася помилка при отриманні даних про заплановані ігри.');
  }
}

// Handler for completed games
export async function handleMyGamesCompleted(ctx: Context) {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const completedGames = await GameModel.getUserCompletedGames(userId);

    if (completedGames.length === 0) {
      return ctx.editMessageText('У вас немає зіграних ігор.', {
        reply_markup: createBackToMenuKeyboard()
      });
    }

    let message = '✅ *Ваші зіграні ігри:*\n\n';
    
    completedGames.forEach((game, index) => {
      const opponent = game.player1Id === userId ? game.player2Username : game.player1Username;
      const date = formatDate(game.scheduledTime);
      const isWinner = game.winnerId === userId;
      const result = isWinner ? 'Перемога ✓' : 'Поразка ✗';
      const score = game.score ? `(${game.score})` : '';
      
      message += `${index + 1}. Гра з *${opponent}*\n📅 ${date}\n🏆 ${result} ${score}\n\n`;
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: createBackToMenuKeyboard()
    });
  } catch (error) {
    console.error('Error in handleMyGamesCompleted:', error);
    await ctx.reply('Сталася помилка при отриманні даних про зіграні ігри.');
  }
}

// Handler for pending games
export async function handleMyGamesPending(ctx: Context) {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    const pendingGames = await GameModel.getUserPendingGames(userId);
    // Filter only PENDING status games
    const onlyPendingGames = pendingGames.filter(game => game.status === GameStatus.PENDING);

    if (onlyPendingGames.length === 0) {
      return ctx.editMessageText('У вас немає ігор, що очікують підтвердження.', {
        reply_markup: createBackToMenuKeyboard()
      });
    }

    let message = '⏳ *Ігри, що очікують підтвердження:*\n\n';
    
    onlyPendingGames.forEach((game, index) => {
      const opponent = game.player1Id === userId ? game.player2Username : game.player1Username;
      const date = formatDate(game.scheduledTime);
      const isPending = game.createdBy === userId ? 
        'Очікує підтвердження від суперника' : 
        'Очікує на ваше підтвердження';
      
      message += `${index + 1}. Гра з *${opponent}*\n📅 ${date}\n🔄 ${isPending}\n\n`;
    });

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: createBackToMenuKeyboard()
    });
  } catch (error) {
    console.error('Error in handleMyGamesPending:', error);
    await ctx.reply('Сталася помилка при отриманні даних про ігри, що очікують підтвердження.');
  }
}
