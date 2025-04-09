import { getDb } from '../db/connection';

// Базовое количество очков за победу
const BASE_POINTS = 10;

/**
 * Обновляет рейтинги игроков после игры
 * 
 * @param player1Id Телеграм ID первого игрока
 * @param player2Id Телеграм ID второго игрока
 * @param winnerId Телеграм ID победителя
 */
export async function updateRankingsAfterGame(
  player1Id: number,
  player2Id: number,
  winnerId: number
): Promise<void> {
  try {
    const db = getDb();
    const usersCollection = db.collection('users');

    // Определяем победителя и проигравшего
    const winnerTelegramId = winnerId;
    const loserTelegramId = winnerId === player1Id ? player2Id : player1Id;

    // Обновление счета для победителя
    await usersCollection.updateOne(
      { telegramId: winnerTelegramId },
      { 
        $inc: { 
          points: BASE_POINTS,
          gamesPlayed: 1,
          gamesWon: 1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Обновление счета для проигравшего
    await usersCollection.updateOne(
      { telegramId: loserTelegramId },
      { 
        $inc: { 
          gamesPlayed: 1,
          gamesLost: 1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Обновление таблицы рейтингов (если используется отдельная коллекция)
    const rankingsCollection = db.collection('rankings');

    // Для каждого игрока обновляем или создаем запись в рейтинге
    const players = [winnerTelegramId, loserTelegramId];
    
    for (const telegramId of players) {
      // Получаем актуальные данные пользователя
      const user = await usersCollection.findOne({ telegramId });
      
      if (user) {
        // Проверяем, есть ли уже запись в рейтинге
        const existingRanking = await rankingsCollection.findOne({ userId: telegramId });
        
        if (existingRanking) {
          // Обновляем существующую запись
          await rankingsCollection.updateOne(
            { userId: telegramId },
            {
              $set: {
                points: user.points || 0,
                username: user.username,
                updatedAt: new Date()
              }
            }
          );
        } else {
          // Создаем новую запись
          await rankingsCollection.insertOne({
            userId: telegramId,
            username: user.username,
            points: user.points || 0,
            position: 0, // Позиция будет пересчитана позже
            updatedAt: new Date()
          });
        }
      }
    }

    // Пересчет позиций в рейтинге для всех игроков
    await recalculateRankingPositions();

  } catch (error) {
    console.error('Error updating rankings:', error);
    throw error;
  }
}

/**
 * Пересчитывает позиции всех игроков в рейтинге
 */
async function recalculateRankingPositions(): Promise<void> {
  const db = getDb();
  const rankingsCollection = db.collection('rankings');
  
  // Получаем все рейтинги, отсортированные по очкам
  const rankings = await rankingsCollection.find().sort({ points: -1 }).toArray();
  
  // Обновляем позиции
  for (let i = 0; i < rankings.length; i++) {
    const position = i + 1; // Позиции начинаются с 1
    
    await rankingsCollection.updateOne(
      { _id: rankings[i]._id },
      { $set: { position } }
    );
  }
}
