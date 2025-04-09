import { Context } from 'grammy';
import * as userModel from '../../models/UserModel';
import { createMainMenuKeyboard } from '../keyboards';

/**
 * Обробник команди /start
 */
export async function handleStartCommand(ctx: Context): Promise<void> {
  const user = ctx.from;
  if (!user) return;

  try {
    const existingUser = await userModel.findUserByTelegramId(user.id);
    
    if (existingUser) {
      await ctx.reply(`👋 Ласкаво просимо назад, ${user.first_name}! Готові зіграти в теніс? 🎾`);
    } else {
      // Реєстрація нового користувача
      const newUser = {
        telegramId: user.id,
        username: user.username || `user_${user.id}`,
        firstName: user.first_name,
        lastName: user.last_name || '',
        points: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await userModel.createUser(newUser);
      await ctx.reply(`🎉 Ласкаво просимо до бота тенісного клубу, ${user.first_name}! Ви успішно зареєстровані. 🎾`);
    }
    
    await showMainMenu(ctx);
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('❌ Виникла помилка при обробці команди. Будь ласка, спробуйте знову пізніше.');
  }
}

/**
 * Показати головне меню
 */
export async function showMainMenu(ctx: Context): Promise<void> {
  const keyboard = createMainMenuKeyboard();
  
  await ctx.reply('📱 Головне меню - Що ви бажаєте зробити?', {
    reply_markup: keyboard
  });
}