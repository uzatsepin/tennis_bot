import { BotContext } from '../BotService';
import * as gameModel from '../../models/GameModel';
import { GameStatus } from '../../models/types';

/**
 * Обробник підтвердження гри
 */
export async function handleConfirmGame(ctx: BotContext): Promise<void> {
  try {
    // Отримуємо ID гри з даних callback
    const gameId = ctx.callbackQuery?.data?.split(':')[1];
    
    if (!gameId) {
      await ctx.answerCallbackQuery({
        text: '❌ Помилка: Не вдалося отримати ID гри',
        show_alert: true
      });
      return;
    }
    
    // Отримуємо інформацію про гру
    const game = await gameModel.getGameById(gameId);
    
    if (!game) {
      await ctx.answerCallbackQuery({
        text: '❌ Помилка: Гру не знайдено',
        show_alert: true
      });
      return;
    }
    
    // Перевіряємо, що гра очікує підтвердження
    if (game.status !== GameStatus.PENDING) {
      await ctx.answerCallbackQuery({
        text: '⚠️ Ця гра вже не очікує підтвердження',
        show_alert: true
      });
      return;
    }
    
    // Перевіряємо, що користувач, який натиснув кнопку, є запрошеним гравцем
    const currentUserId = ctx.from?.id;
    if (game.player2Id !== currentUserId) {
      await ctx.answerCallbackQuery({
        text: '⛔ Ви не можете підтвердити цю гру',
        show_alert: true
      });
      return;
    }
    
    // Оновлюємо статус гри на "заплановану"
    await gameModel.updateGameStatus(gameId, GameStatus.SCHEDULED);
    
    // Відправляємо повідомлення про успішне підтвердження
    await ctx.answerCallbackQuery({
      text: '✅ Гру підтверджено! Очікуємо вас на корті.',
      show_alert: true
    });
    
    // Оновлюємо повідомлення, прибираємо кнопки
    await ctx.editMessageText(
      `🎾 Гру підтверджено! ✅\n\nГравець: ${game.player1Username}\nДата: ${new Date(game.scheduledTime).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n\nГарної гри! 🏆`
    );
    
    // Відправляємо сповіщення гравцю, який створив гру
    await ctx.api.sendMessage(
      game.player1Id,
      `🎉 Гравець ${game.player2Username} прийняв ваше запрошення на гру!\n\nДата: ${new Date(game.scheduledTime).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n\nГарної гри! 🏆`
    );
    
  } catch (error) {
    console.error('Error handling game confirmation:', error);
    await ctx.answerCallbackQuery({
      text: '❌ Виникла помилка при підтвердженні гри',
      show_alert: true
    });
  }
}

/**
 * Обробник відхилення гри
 */
export async function handleRejectGame(ctx: BotContext): Promise<void> {
  try {
    // Отримуємо ID гри з даних callback
    const gameId = ctx.callbackQuery?.data?.split(':')[1];
    
    if (!gameId) {
      await ctx.answerCallbackQuery({
        text: '❌ Помилка: Не вдалося отримати ID гри',
        show_alert: true
      });
      return;
    }
    
    // Отримуємо інформацію про гру
    const game = await gameModel.getGameById(gameId);
    
    if (!game) {
      await ctx.answerCallbackQuery({
        text: '❌ Помилка: Гру не знайдено',
        show_alert: true
      });
      return;
    }
    
    // Перевіряємо, що гра очікує підтвердження
    if (game.status !== GameStatus.PENDING) {
      await ctx.answerCallbackQuery({
        text: '⚠️ Ця гра вже не очікує підтвердження',
        show_alert: true
      });
      return;
    }
    
    // Перевіряємо, що користувач, який натиснув кнопку, є запрошеним гравцем
    const currentUserId = ctx.from?.id;
    if (game.player2Id !== currentUserId) {
      await ctx.answerCallbackQuery({
        text: '⛔ Ви не можете відхилити цю гру',
        show_alert: true
      });
      return;
    }
    
    // Оновлюємо статус гри на "відхилено"
    await gameModel.updateGameStatus(gameId, GameStatus.REJECTED);
    
    // Відправляємо повідомлення про відхилення
    await ctx.answerCallbackQuery({
      text: '❌ Ви відхилили запрошення на гру',
      show_alert: true
    });
    
    // Оновлюємо повідомлення, прибираємо кнопки
    await ctx.editMessageText(
      `🎾 Гру відхилено ❌\n\nГравець: ${game.player1Username}\nДата: ${new Date(game.scheduledTime).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    );
    
    // Відправляємо сповіщення гравцю, який створив гру
    await ctx.api.sendMessage(
      game.player1Id,
      `😔 На жаль, гравець ${game.player2Username} відхилив ваше запрошення на гру.\n\nДата: ${new Date(game.scheduledTime).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    );
    
  } catch (error) {
    console.error('Error handling game rejection:', error);
    await ctx.answerCallbackQuery({
      text: '❌ Виникла помилка при відхиленні гри',
      show_alert: true
    });
  }
}