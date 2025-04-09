import { Context, SessionFlavor } from 'grammy';
import * as gameModel from '../../models/GameModel';
import { BotSession, GameStatus } from '../../models/types';
import { createBackToMenuKeyboard } from '../keyboards';

type BotContext = Context & SessionFlavor<BotSession>;

/**
 * Обробник підтвердження запрошення на гру
 */
export async function handleConfirmGame(ctx: BotContext): Promise<void> {
  const gameId = ctx.match?.[1];
  if (!gameId) {
    await ctx.editMessageText('❌ Помилка обробки запрошення. Спробуйте ще раз або зв\'яжіться з організатором гри.', {
      reply_markup: createBackToMenuKeyboard()
    });
    return;
  }

  console.log(`Processing confirm_game with gameId: ${gameId}`);

  try {
    // Получаем данные о игре
    const game = await gameModel.getGameById(gameId);
    console.log(`Game found for ID ${gameId}:`, game);

    if (!game) {
      await ctx.editMessageText('❌ Гра не знайдена. Можливо, вона була скасована.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }

    // Проверяем, что пользователь является оппонентом в игре
    const user = ctx.from;
    if (!user || (user.id !== game.player2Id)) {
      await ctx.editMessageText('⛔ Ви не можете підтвердити цю гру, оскільки вона призначена для іншого користувача.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }

    // Проверяем, что игра все еще в статусе ожидания подтверждения
    if (game.status !== GameStatus.PENDING) {
      await ctx.editMessageText('⚠️ Ця гра вже не очікує на підтвердження.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }

    // Обновляем статус игры на "запланировано"
    await gameModel.updateGame(gameId, {
      status: GameStatus.SCHEDULED,
      updatedAt: new Date()
    });

    // Отправляем уведомление оппоненту
    await ctx.editMessageText(`✅ Ви підтвердили гру з @${game.player1Username} на ${new Date(game.scheduledTime).toLocaleString()}. 🎾 Гра запланована!`, {
      reply_markup: createBackToMenuKeyboard()
    });

    // Отправляем уведомление инициатору
    try {
      await ctx.api.sendMessage(
        game.player1Id,
        `🎉 @${game.player2Username} підтвердив(ла) вашу пропозицію зіграти в теніс ${new Date(game.scheduledTime).toLocaleString()}. 🎾 Гра запланована!`
      );
    } catch (error) {
      console.error('Error sending confirmation notification to initiator:', error);
    }
  } catch (error) {
    console.error(`Error handling game confirmation for ID ${gameId}:`, error);
    await ctx.editMessageText('❌ Виникла помилка при підтвердженні гри. Будь ласка, спробуйте пізніше.', {
      reply_markup: createBackToMenuKeyboard()
    });
  }
}

/**
 * Обробник відхилення запрошення на гру
 */
export async function handleRejectGame(ctx: BotContext): Promise<void> {
  const gameId = ctx.match?.[1];
  if (!gameId) {
    await ctx.editMessageText('❌ Помилка обробки запрошення. Спробуйте ще раз або зв\'яжіться з організатором гри.', {
      reply_markup: createBackToMenuKeyboard()
    });
    return;
  }

  console.log(`Processing reject_game with gameId: ${gameId}`);

  try {
    // Получаем данные о игре
    const game = await gameModel.getGameById(gameId);
    console.log(`Game found for ID ${gameId}:`, game);

    if (!game) {
      await ctx.editMessageText('❌ Гра не знайдена. Можливо, вона була скасована.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }

    // Проверяем, что пользователь является оппонентом в игре
    const user = ctx.from;
    if (!user || (user.id !== game.player2Id)) {
      await ctx.editMessageText('⛔ Ви не можете відхилити цю гру, оскільки вона призначена для іншого користувача.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }

    // Проверяем, что игра все еще в статусе ожидания подтверждения
    if (game.status !== GameStatus.PENDING) {
      await ctx.editMessageText('⚠️ Ця гра вже не очікує на підтвердження.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }

    // Обновляем статус игры на "отклонено"
    await gameModel.updateGame(gameId, {
      status: GameStatus.REJECTED,
      updatedAt: new Date()
    });

    // Отправляем уведомление оппоненту
    await ctx.editMessageText(`❌ Ви відхилили гру з @${game.player1Username} на ${new Date(game.scheduledTime).toLocaleString()}.`, {
      reply_markup: createBackToMenuKeyboard()
    });

    // Отправляем уведомление инициатору
    try {
      await ctx.api.sendMessage(
        game.player1Id,
        `⛔ @${game.player2Username} відхилив(ла) вашу пропозицію зіграти в теніс ${new Date(game.scheduledTime).toLocaleString()}.`
      );
    } catch (error) {
      console.error('Error sending rejection notification to initiator:', error);
    }
  } catch (error) {
    console.error(`Error handling game rejection for ID ${gameId}:`, error);
    await ctx.editMessageText('❌ Виникла помилка при відхиленні гри. Будь ласка, спробуйте пізніше.', {
      reply_markup: createBackToMenuKeyboard()
    });
  }
}