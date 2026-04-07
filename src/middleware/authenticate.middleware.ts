import type { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';
import User from '../models/users.model.js';

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not defined`);
  return value;
};

const ACCESS_TOKEN_SECRET = getEnv('ACCESS_TOKEN_SECRET');

interface JwtPayload extends DefaultJwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        onboardingStep: string;
        isEmailVerified: boolean;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return void res.status(401).json({ message: 'Unauthorized: No token' });
    }
    const token = authHeader.split(' ')[1];

    if (!token) {
      return void res.status(401).json({ message: 'Unauthorized: Invalid token format' });
    }

    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    if (typeof decoded === 'string' || !('userId' in decoded)) {
      return void res.status(401).json({ message: 'Invalid token payload' });
    }

    const payload = decoded as JwtPayload;
    const user = await User.findById(payload.userId).select('_id onboardingStep isEmailVerified');

    if (!user) {
      return void res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    req.user = {
      id: user._id.toString(),
      onboardingStep: user.onboardingStep,
      isEmailVerified: user.isEmailVerified,
    };

    return next();
  } catch (error) {
    return void res.status(401).json({ message: 'Invalid or expired token' });
  }
};
