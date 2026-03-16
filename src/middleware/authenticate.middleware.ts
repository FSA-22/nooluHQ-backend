import { AuthenticatedRequest } from '@/types/AuthenticatedRequest.ts';
import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization token missing or malformed.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      res.status(500).json({ message: 'Server configuration error.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload & {
      id: string;
      email: string;
      onboardingStep?: string;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      onboardingStep: decoded.onboardingStep,
    };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};
