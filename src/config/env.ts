import { config } from 'dotenv';

// Manually call config to use your dynamic path logic
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const {
  PORT,
  CLIENT_URL,
  NODE_ENV,
  DATABASE_URI,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_SECRET,
  GOOGLE_CLIENT_ID,
  RESEND_API_KEY,
  FRONTEND_URL,
} = process.env;

if (!process.env.DATABASE_URI) {
  throw new Error('DATABASE_URL is not defined');
}
