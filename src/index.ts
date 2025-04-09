import * as dotenv from 'dotenv';
import { connectToDatabase, closeDatabase } from './db/connection';
import { startBot } from './bot/BotService';
import { startApiServer } from './api';

// Загрузка переменных окружения
dotenv.config();

/**
 * Основная функция запуска приложения
 */
async function main() {
  try {
    // Подключение к базе данных
    await connectToDatabase();
    console.log('Подключение к базе данных успешно установлено');

    // Запуск Telegram бота
    const bot = startBot();
    console.log('Telegram бот успешно запущен');

    // Запуск API сервера
    const server = startApiServer();
    console.log('API сервер успешно запущен');

    // Обработка корректного завершения работы
    setupGracefulShutdown(server);
  } catch (error) {
    console.error('Ошибка при запуске приложения:', error);
    process.exit(1);
  }
}

/**
 * Настройка корректного завершения работы приложения
 */
function setupGracefulShutdown(server: any) {
  const shutdown = async () => {
    console.log('Получен сигнал завершения, закрытие соединений...');
    
    // Закрытие HTTP сервера
    server.close(() => {
      console.log('HTTP сервер закрыт');
    });
    
    // Закрытие соединения с базой данных
    try {
      await closeDatabase();
      console.log('Соединение с базой данных закрыто');
    } catch (error) {
      console.error('Ошибка при закрытии соединения с базой данных:', error);
    }
    
    // Завершение процесса
    process.exit(0);
  };

  // Подписка на сигналы завершения
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Запуск приложения
main();