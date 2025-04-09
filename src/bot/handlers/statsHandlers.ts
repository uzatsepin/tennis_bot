import { Context, SessionFlavor } from 'grammy';
import * as userModel from '../../models/UserModel';
import * as gameModel from '../../models/GameModel';
import * as rankingModel from '../../models/RankingModel';
import { BotSession } from '../../models/types';
import { createBackToMenuKeyboard } from '../keyboards';

type BotContext = Context & SessionFlavor<BotSession>;

/**
 * Обробник кнопки "Моя статистика"
 */
export async function handleMyStats(ctx: BotContext): Promise<void> {
  const user = ctx.from;
  if (!user) return;
  
  try {
    const userData = await userModel.findUserByTelegramId(user.id);
    if (!userData) {
      await ctx.editMessageText('❓ Ви не зареєстровані. Будь ласка, скористайтеся командою /start для реєстрації.', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }
    
    const ranking = await rankingModel.getUserRanking(user.id);
    const rank = ranking ? ranking.position : 'Н/Д';
    
    const lastGame = await gameModel.getLastGame(user.id);
    const lastGameInfo = lastGame 
      ? `🔄 Остання гра: ${lastGame.player1Username} vs ${lastGame.player2Username} (${new Date(lastGame.scheduledTime).toLocaleDateString()})` 
      : '📭 Немає зіграних ігор';
    
    // Знаходимо найчастішого опонента
    const opponents = await gameModel.getMostFrequentOpponents(user.id, 1);
    const frequentOpponent = opponents.length > 0 
      ? `👥 Найчастіший опонент: ${opponents[0].opponentUsername} (${opponents[0].gamesCount} ігор)` 
      : '👤 Поки немає постійних опонентів';
    
    const statsMessage = `
📊 Ваша статистика:

🎾 Всього ігор: ${userData.gamesPlayed}
🥇 Перемог: ${userData.gamesWon}
❌ Поразок: ${userData.gamesLost}
💯 Очки: ${userData.points}
🏆 Рейтинг: ${rank}

${frequentOpponent}
${lastGameInfo}
`;
    
    await ctx.editMessageText(statsMessage, {
      reply_markup: createBackToMenuKeyboard()
    });
  } catch (error) {
    console.error('Error in handleMyStats:', error);
    await ctx.editMessageText('❌ Виникла помилка при отриманні статистики. Будь ласка, спробуйте пізніше.', {
      reply_markup: createBackToMenuKeyboard()
    });
  }
}

/**
 * Обробник кнопки "Рейтинг"
 */
export async function handleRankings(ctx: BotContext): Promise<void> {
  try {
    const rankings = await rankingModel.getRankings(10);
    
    if (rankings.length === 0) {
      await ctx.editMessageText('⚠️ Рейтинг поки недоступний. Зіграйте кілька ігор спочатку!', {
        reply_markup: createBackToMenuKeyboard()
      });
      return;
    }
    
    let rankingsMessage = '🏆 Рейтинг гравців:\n\n';
    
    // Додаємо медалі для топ-3 гравців
    for (let i = 0; i < rankings.length; i++) {
      const ranking = rankings[i];
      let prefix = `${ranking.position}.`;
      
      // Додаємо медалі для топ-3
      if (ranking.position === 1) {
        prefix = '🥇';
      } else if (ranking.position === 2) {
        prefix = '🥈';
      } else if (ranking.position === 3) {
        prefix = '🥉';
      }
      
      rankingsMessage += `${prefix} ${ranking.username} - ${ranking.points} очків\n`;
    }
    
    await ctx.editMessageText(rankingsMessage, {
      reply_markup: createBackToMenuKeyboard()
    });
  } catch (error) {
    console.error('Error in handleRankings:', error);
    await ctx.editMessageText('❌ Виникла помилка при отриманні рейтингу. Будь ласка, спробуйте пізніше.', {
      reply_markup: createBackToMenuKeyboard()
    });
  }
}