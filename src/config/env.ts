import { config } from 'dotenv';

// Manually call config to use your dynamic path logic
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  PORT,
  CLIENT_URL,
  NODE_ENV,
  DATABASE_URL,

  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_SECRET,
} = process.env;

// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not defined');
// }
