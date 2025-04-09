# Tennis Bot API Documentation

## Типы данных

```typescript
// Статус игры
enum GameStatus {
  DRAFT = 'draft',           // Черновик
  PENDING = 'pending',       // Ожидает подтверждения от оппонента
  SCHEDULED = 'scheduled',   // Подтверждено обоими игроками
  COMPLETED = 'completed',   // Игра завершена
  CANCELLED = 'cancelled',   // Игра отменена
  REJECTED = 'rejected'      // Отклонено оппонентом
}

// Пользователь
interface User {
  _id?: string;              // ID в базе данных MongoDB
  telegramId: number;        // ID пользователя в Telegram
  username: string;          // Имя пользователя
  firstName: string;         // Имя
  lastName?: string;         // Фамилия (опционально)
  points: number;            // Очки рейтинга
  gamesPlayed: number;       // Количество игр
  gamesWon: number;          // Количество побед
  gamesLost: number;         // Количество поражений
  age?: number;              // Возраст (опционально)
  height?: number;           // Рост в см (опционально)
  weight?: number;           // Вес в кг (опционально)
  forehand?: string;         // Тип форхенда (опционально)
  createdAt: Date;           // Дата создания
  updatedAt: Date;           // Дата обновления
}

// Игра
interface Game {
  _id?: string;              // ID в базе данных MongoDB
  player1Id: number;         // ID первого игрока в Telegram
  player2Id: number;         // ID второго игрока в Telegram
  player1Username: string;   // Имя пользователя первого игрока
  player2Username: string;   // Имя пользователя второго игрока
  scheduledTime: Date;       // Запланированное время игры
  status: GameStatus;        // Статус игры
  score?: string;            // Счет (например, "6:4, 7:5")
  winnerId?: number;         // ID победителя в Telegram
  createdAt: Date;           // Дата создания
  updatedAt: Date;           // Дата обновления
  createdBy: number;         // ID создателя игры в Telegram
  player1: User;
  player2: User;
}

// Рейтинг
interface Ranking {
  _id?: string;              // ID в базе данных MongoDB
  userId: number;            // ID пользователя в Telegram
  username: string;          // Имя пользователя
  points: number;            // Очки рейтинга
  position: number;          // Позиция в рейтинге
  updatedAt: Date;         // Дата обновления
  user: User;
}
```

## Эндпоинты API

Базовый URL: `/api`

### Пользователи

#### Получение списка пользователей
```
GET /users
```

**Параметры запроса:**
- `limit` (опционально): Максимальное количество пользователей для получения (по умолчанию 100)

**Ответ:**
```typescript
User[]
```

#### Получение количества пользователей
```
GET /users/count
```

**Ответ:**
```typescript
{
  count: number;
}
```

#### Получение пользователя по ID
```
GET /users/:id
```

**Параметры пути:**
- `id`: ID пользователя в Telegram

**Ответ:**
```typescript
User
```

#### Регистрация нового пользователя
```
POST /users/register
```

**Тело запроса:**
```typescript
{
  username: string;          // Имя пользователя (обязательно)
  firstName: string;         // Имя (обязательно)
  lastName?: string;         // Фамилия (опционально)
  age?: number;              // Возраст (опционально)
  height?: number;           // Рост в см (опционально)
  weight?: number;           // Вес в кг (опционально)
  forehand?: string;         // Тип форхенда (опционально)
}
```

**Ответ:**
```typescript
User
```

**Статусы ответа:**
- `201`: Пользователь успешно создан
- `400`: Ошибка валидации (отсутствуют обязательные поля)
- `409`: Пользователь с таким username уже существует
- `500`: Внутренняя ошибка сервера

#### Обновление профиля пользователя
```
PUT /users/:id/profile
```

**Параметры пути:**
- `id`: ID пользователя в Telegram

**Тело запроса:**
```typescript
{
  firstName?: string;        // Имя (опционально)
  lastName?: string;         // Фамилия (опционально)
  age?: number;              // Возраст (опционально)
  height?: number;           // Рост в см (опционально)
  weight?: number;           // Вес в кг (опционально)
  forehand?: string;         // Тип форхенда (опционально)
}
```

**Ответ:**
```typescript
User
```

**Статусы ответа:**
- `200`: Профиль успешно обновлен
- `404`: Пользователь не найден
- `500`: Внутренняя ошибка сервера

### Игры

#### Получение списка игр
```
GET /games
```

**Параметры запроса:**
- `limit` (опционально): Максимальное количество игр для получения
- `status` (опционально): Фильтр по статусу игры

**Ответ:**
```typescript
Game[]
```

#### Получение количества игр
```
GET /games/count
```

**Ответ:**
```typescript
{
  count: number;
}
```

#### Получение игры по ID
```
GET /games/:id
```

**Параметры пути:**
- `id`: ID игры в MongoDB

**Ответ:**
```typescript
Game
```

#### Получение игр пользователя
```
GET /users/:id/games
```

**Параметры пути:**
- `id`: ID пользователя в Telegram

**Параметры запроса:**
- `status` (опционально): Фильтр по статусу игры

**Ответ:**
```typescript
Game[]
```

#### Создание новой игры
```
POST /games
```

**Тело запроса:**
```typescript
{
  player1Id: number;         // ID первого игрока в Telegram (обязательно)
  player2Id: number;         // ID второго игрока в Telegram (обязательно)
  scheduledTime: Date;       // Запланированное время игры (обязательно)
}
```

**Ответ:**
```typescript
Game
```

**Статусы ответа:**
- `201`: Игра успешно создана
- `400`: Ошибка валидации (отсутствуют обязательные поля)
- `500`: Внутренняя ошибка сервера

### Рейтинги

#### Получение рейтинга
```
GET /rankings
```

**Параметры запроса:**
- `limit` (опционально): Максимальное количество позиций в рейтинге

**Ответ:**
```typescript
Ranking[]
```

#### Получение рейтинга пользователя
```
GET /users/:id/ranking
```

**Параметры пути:**
- `id`: ID пользователя в Telegram

**Ответ:**
```typescript
Ranking
```

## Примеры запросов

### Регистрация нового пользователя
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "tennis_player",
  "firstName": "Иван",
  "lastName": "Иванов",
  "age": 28,
  "height": 182,
  "weight": 75,
  "forehand": "one-handed"
}
```

### Обновление профиля пользователя
```http
PUT /api/users/123456789/profile
Content-Type: application/json

{
  "firstName": "Иван",
  "lastName": "Петров",
  "age": 29,
  "height": 182,
  "weight": 73,
  "forehand": "two-handed"
}
```

### Получение рейтинга пользователя
```http
GET /api/users/123456789/ranking
```

### Получение списка игр пользователя
```http
GET /api/users/123456789/games?status=completed
```