import { Context, SessionFlavor } from 'grammy';
import * as gameModel from '../../models/GameModel';
import * as userModel from '../../models/UserModel';
import { BotSession, Game, GameStatus } from '../../models/types';
import { createBackToMenuKeyboard, createSelectGameKeyboard } from '../keyboards';
import { InlineKeyboard } from 'grammy';

type BotContext = Context & SessionFlavor<BotSession>;

/**
 * Обробник кнопки "Запланувати гру"
 */
export async function handleScheduleGame(ctx: BotContext): Promise<void> {
  ctx.session.step = 'schedule_game_username';
  ctx.session.gameData = {};
  
  await ctx.editMessageText('👥 З ким бажаєте зіграти? Будь ласка, введіть ім\'я користувача вашого опонента.\n\nПриклад @username');
}

/**
 * Обробник кнопки "Додати результат"
 */
export async function handleAddResult(ctx: BotContext): Promise<void> {
  const user = ctx.from;
  if (!user) return;
  
  try {
    const pendingGames = await gameModel.getUserPendingGames(user.id);
    
    if (pendingGames.length === 0) {
      await ctx.editMessageText('❗️ У вас немає запланованих ігор. Спочатку заплануйте гру!', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }
    
    const keyboard = createSelectGameKeyboard(pendingGames, user.id);
    
    ctx.session.step = 'add_result_select';
    await ctx.editMessageText('🔍 Виберіть гру для додавання результатів:', {
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in handleAddResult:', error);
    await ctx.editMessageText('❌ Виникла помилка під час завантаження ваших ігор. Будь ласка, спробуйте пізніше.', {
      reply_markup: createBackToMenuKeyboard()
    });
  }
}

/**
 * Обробник вибору гри для додавання результату
 */
export async function handleGameSelect(ctx: BotContext): Promise<void> {
  const gameId = ctx.match?.[1];
  if (!gameId) return;
  
  console.log(`Processing game_select with gameId: ${gameId}`);
  
  try {
    // Проверка, существует ли игра с таким ID
    const game = await gameModel.getGameById(gameId);
    console.log(`Game found for ID ${gameId}:`, game);
    
    if (!game) {
      await ctx.editMessageText('❌ Гра не знайдена. Будь ласка, спробуйте знову.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }
    
    ctx.session.step = 'add_result_score';
    ctx.session.gameData = { 
      ...ctx.session.gameData,
      gameId
    };
    
    await ctx.editMessageText('📝 Будь ласка, введіть рахунок матчу (наприклад, "6:4, 7:5").\n\nОбовʼязково більший рахунок має бути першим', {
      reply_markup: createBackToMenuKeyboard()
    });
  } catch (error) {
    console.error(`Error handling game selection for ID ${gameId}:`, error);
    await ctx.editMessageText('❌ Виникла помилка при виборі гри. Будь ласка, спробуйте пізніше.', {
      reply_markup: createBackToMenuKeyboard()
    });
  }
}

/**
 * Обробник вибору переможця
 */
export async function handleWinnerSelect(ctx: BotContext): Promise<void> {
  const winnerId = Number(ctx.match?.[1]);
  const gameId = ctx.session.gameData?.gameId;
  const score = ctx.session.gameData?.score;
  
  if (!gameId || !score) return;
  
  try {
    const game = await gameModel.getGameById(gameId);
    if (!game) {
      await ctx.editMessageText('❌ Гра не знайдена. Будь ласка, спробуйте знову.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }
    
    // Оновлення гри з результатами
    await gameModel.updateGame(gameId, {
      status: GameStatus.COMPLETED,
      score,
      winnerId,
      updatedAt: new Date()
    });
    
    // Оновлення статистики гравців
    await userModel.updateUserStats(game.player1Id, game.player1Id === winnerId);
    await userModel.updateUserStats(game.player2Id, game.player2Id === winnerId);
    
    // Оновлення рейтингів
    const rankingModel = await import('../../models/RankingModel');
    await rankingModel.updateRankings();
    
    await ctx.editMessageText(`✅ Результати успішно збережені! 🏆 Гра завершена з рахунком: ${score}`, {
      reply_markup: createBackToMenuKeyboard()
    });
    
    // Очищення сесії
    ctx.session = {};
  } catch (error) {
    console.error('Error in handleWinnerSelect:', error);
    await ctx.editMessageText('❌ Виникла помилка під час збереження результатів. Будь ласка, спробуйте пізніше.', {
      reply_markup: createBackToMenuKeyboard()
    });
  }
}

/**
 * Обробник текстових повідомлень для діалогу планування гри
 */
export async function handleScheduleGameFlow(ctx: BotContext, text: string): Promise<void> {
  const user = ctx.from;
  if (!user) return;
  
  switch (ctx.session.step) {
    case 'schedule_game_username':
      const opponentUsername = text.replace('@', '');
      
      // Перевірка, чи існує користувач з таким username
      const opponent = await userModel.findUserByUsername(opponentUsername);
      if (!opponent) {
        await ctx.reply('❌ Користувач з таким ім\'ям не знайдений в нашій базі даних. Можливо, він ще не зареєстрований в боті. Запропонуйте йому почати користуватися ботом, виконавши команду /start.');
        return;
      }
      
      ctx.session.gameData = {
        ...ctx.session.gameData,
        opponentUsername
      };
      ctx.session.step = 'schedule_game_time';
      await ctx.reply('🗓️ Коли ви хотіли б грати? Будь ласка, введіть дату та час (наприклад, "2023-05-30 15:00")');
      break;
      
    case 'schedule_game_time':
      try {
        const scheduledTime = new Date(text);
        
        if (isNaN(scheduledTime.getTime())) {
          await ctx.reply('❌ Невірний формат дати. Будь ласка, використовуйте формат РРРР-ММ-ДД ГГ:ХХ (наприклад, "2023-05-30 15:00")');
          return;
        }
        
        ctx.session.gameData = {
          ...ctx.session.gameData,
          scheduledTime
        };
        
        // Знаходимо опонента за ім'ям користувача
        const opponentUsername = ctx.session.gameData?.opponentUsername;
        if (!opponentUsername) {
          throw new Error('Ім\'я користувача опонента не вказано');
        }
        
        // Знаходимо опонента в базі даних
        const opponent = await userModel.findUserByUsername(opponentUsername);
        if (!opponent) {
          await ctx.reply('❌ Користувач з таким ім\'ям не знайдений в нашій базі даних. Можливо, він ще не зареєстрований в боті.');
          return;
        }
        
        const newGame: Omit<Game, '_id'> = {
          player1Id: user.id,
          player1Username: user.username || `user_${user.id}`,
          player2Id: opponent.telegramId,
          player2Username: opponentUsername,
          scheduledTime,
          status: GameStatus.PENDING, // Устанавливаем статус "ожидает подтверждения"
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user.id
        };
        
        const game = await gameModel.createGame(newGame);
        
        await ctx.reply(`📨 Запит на гру з @${opponentUsername} на ${scheduledTime.toLocaleString()} надіслано. ⏳ Очікуйте підтвердження від опонента.`, {
          reply_markup: createBackToMenuKeyboard()
        });
        
        // Отправляем уведомление оппоненту
        const gameId = game._id?.toString();
        if (gameId) {
          try {
            const keyboard = new InlineKeyboard()
              .text('✅ Підтвердити', `confirm_game:${gameId}`).row()
              .text('❌ Відхилити', `reject_game:${gameId}`);
            
            // Отправляем уведомление оппоненту (используем id оппонента)
            await ctx.api.sendMessage(
              opponent.telegramId,
              `🎾 Користувач @${user.username || user.first_name} хоче зіграти з вами в теніс ${scheduledTime.toLocaleString()}. Бажаєте прийняти цю пропозицію?`,
              { reply_markup: keyboard }
            );
          } catch (error) {
            console.error('Error sending invitation to opponent:', error);
            await ctx.reply('⚠️ Запит на гру створено, але не вдалося надіслати повідомлення опоненту. Повідомте йому про гру особисто.');
          }
        }
        
        // Очищення сесії
        ctx.session = {};
      } catch (error) {
        await ctx.reply(`❌ Помилка при плануванні гри: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
      }
      break;
  }
}

/**
 * Обробник текстових повідомлень для діалогу додавання результатів
 */
export async function handleAddResultFlow(ctx: BotContext, text: string): Promise<void> {
  if (ctx.session.step === 'add_result_score') {
    ctx.session.gameData = {
      ...ctx.session.gameData,
      score: text
    };
    
    // Отримуємо деталі гри для показу опцій вибору переможця
    const gameId = ctx.session.gameData?.gameId;
    if (!gameId) {
      await ctx.reply('❌ Гра не знайдена. Будь ласка, спробуйте знову.');
      return;
    }
    
    try {
      const game = await gameModel.getGameById(gameId);
      if (!game) {
        await ctx.reply('❌ Гра не знайдена. Будь ласка, спробуйте знову.');
        return;
      }
      
      ctx.session.step = 'add_result_winner';
      
      const keyboard = new InlineKeyboard()
        .text(`🥇 ${game.player1Username} переміг`, `winner_select:${game.player1Id}`).row()
        .text(`🥇 ${game.player2Username} переміг`, `winner_select:${game.player2Id}`).row()
        .text('❌ Скасувати', 'main_menu');
      
      await ctx.reply(`📝 Рахунок записано: ${text}. Хто виграв матч?`, {
        reply_markup: keyboard
      });
    } catch (error) {
      console.error('Error in handleAddResultFlow:', error);
      await ctx.reply('❌ Виникла помилка під час обробки результату. Будь ласка, спробуйте пізніше.', {
        reply_markup: createBackToMenuKeyboard()
      });
    }
  }
}