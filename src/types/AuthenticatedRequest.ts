import { Request } from 'express';

interface AuthenticatedUser {
  id: string;
  onboardingStep: string;
  isEmailVerified: boolean;
}
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
