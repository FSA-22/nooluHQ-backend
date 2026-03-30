import jwt from 'jsonwebtoken';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not defined in environment variables`);
  }
  return value;
};

const ACCESS_TOKEN_SECRET = getEnv('ACCESS_TOKEN_SECRET');
const REFRESH_TOKEN_SECRET = getEnv('REFRESH_TOKEN_SECRET');

type TokenPayload = {
  userId: string;
};

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};
