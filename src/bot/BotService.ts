import { Bot, Context, session, SessionFlavor } from 'grammy';
import config from '../config';
import { BotSession } from '../models/types';

// Імпорт обробників
import { handleStartCommand, showMainMenu } from './handlers/startHandler';
import { 
  handleScheduleGame, 
  handleAddResult, 
  handleGameSelect, 
  handleWinnerSelect,
  handleScheduleGameFlow,
  handleAddResultFlow
} from './handlers/gameHandlers';
import { handleMyStats, handleRankings } from './handlers/statsHandlers';
import { handleConfirmGame, handleRejectGame } from './handlers/invitationHandlers';
import { 
  handleMyGames, 
  handleMyGamesScheduled, 
  handleMyGamesCompleted, 
  handleMyGamesPending 
} from './handlers/myGames';

// Тип контексту з сесією
export type BotContext = Context & SessionFlavor<BotSession>;

/**
 * Ініціалізація бота
 */
export function createBot() {
  const token = config.bot.token;
  if (!token) {
    throw new Error('BOT_TOKEN не визначений в змінних оточення');
  }

  const bot = new Bot<BotContext>(token);
  
  // Налаштування middleware для сесії
  bot.use(session({
    initial: (): BotSession => ({})
  }));
  
  // Скидання стану сесії при нових командах
  bot.use(async (ctx, next) => {
    if (ctx.message?.text?.startsWith('/')) {
      ctx.session = {};
    }
    await next();
  });
  
  // Реєстрація обробників команд
  bot.command('start', handleStartCommand);
  bot.command('menu', showMainMenu);
  
  // Реєстрація обробників кнопок
  bot.callbackQuery('schedule_game', handleScheduleGame);
  bot.callbackQuery('add_result', handleAddResult);
  bot.callbackQuery('my_stats', handleMyStats);
  bot.callbackQuery('rankings', handleRankings);
  bot.callbackQuery('my_games', handleMyGames);
  bot.callbackQuery('my_games_scheduled', handleMyGamesScheduled);
  bot.callbackQuery('my_games_completed', handleMyGamesCompleted);
  bot.callbackQuery('my_games_pending', handleMyGamesPending);
  bot.callbackQuery('main_menu', showMainMenu);
  
  // Реєстрація обробників динамічних callback даних
  bot.callbackQuery(/^game_select:(.+)$/, handleGameSelect);
  bot.callbackQuery(/^winner_select:(.+)$/, handleWinnerSelect);
  
  // Реєстрація обробників для підтвердження/відхилення ігор
  bot.callbackQuery(/^confirm_game:(.+)$/, handleConfirmGame);
  bot.callbackQuery(/^reject_game:(.+)$/, handleRejectGame);
  
  // Обробка текстових повідомлень в залежності від контексту сесії
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    
    // Обробка різних кроків діалогу на основі стану сесії
    if (ctx.session.step?.startsWith('schedule_game')) {
      await handleScheduleGameFlow(ctx, text);
    } else if (ctx.session.step?.startsWith('add_result')) {
      await handleAddResultFlow(ctx, text);
    } else {
      await ctx.reply('Я не розумію. Будь ласка, використовуйте кнопки меню.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Показати меню', callback_data: 'main_menu' }]]
        }
      });
    }
  });
  
  return bot;
}

/**
 * Запуск бота
 */
export function startBot() {
  const bot = createBot();
  console.log('Запуск Telegram бота...');
  bot.start();
  return bot;
}