import { Router } from 'express';
import {
  acceptInvite,
  createWorkspace,
  inviteTeammate,
} from '../controllers/workspace.controller.ts';
import { requireAuth } from '../middleware/authenticate.middleware.ts';
import { requireOnboardingStep } from '../middleware/onboarding.middleware.ts';

const workspaceRouter = Router();

workspaceRouter.post(
  '/workspace',
  requireAuth,
  requireOnboardingStep('workspace'),
  createWorkspace,
);

workspaceRouter.post(
  '/workspace/invite',
  requireAuth,
  requireOnboardingStep('workspace'),
  inviteTeammate,
);

workspaceRouter.post(
  '/workspace/accept-invite',
  requireAuth,
  requireOnboardingStep('workspace'),
  acceptInvite,
);

export default workspaceRouter;
