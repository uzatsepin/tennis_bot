import * as dotenv from 'dotenv';

dotenv.config();

const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:admin@localhost:27018',
    dbName: process.env.MONGODB_DB_NAME || 'tennis_club',
  },
  bot: {
    token: process.env.BOT_TOKEN || '',
  },
  api: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
};

export default config;