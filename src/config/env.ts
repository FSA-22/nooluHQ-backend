import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  PORT,
  CLIENT_URL,
  NODE_ENV,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  DATABASE_URL,
} = process.env;

// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not defined');
// }
