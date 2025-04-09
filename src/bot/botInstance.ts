import { Bot } from 'grammy';
import { BotContext } from './BotService';

// The bot instance that will be set when the bot is initialized
let botInstance: Bot<BotContext> | null = null;

/**
 * Sets the bot instance for use across the application
 */
export function setBotInstance(bot: Bot<BotContext>): void {
  botInstance = bot;
}

/**
 * Gets the bot instance for use in notifications and other services
 */
export function getBotInstance(): Bot<BotContext> {
  if (!botInstance) {
    throw new Error('Bot instance not initialized. Call setBotInstance first.');
  }
  return botInstance;
}
