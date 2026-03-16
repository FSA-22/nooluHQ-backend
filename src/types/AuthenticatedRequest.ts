import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  onboardingStep?: string; // optional if not always present
  // Add other claims like roles, permissions, etc.
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
