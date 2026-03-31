import { Router } from 'express';
import {
  acceptInvite,
  createWorkspace,
  inviteTeammate,
} from '../controllers/workspace.controller.js';
import { requireAuth } from '../middleware/authenticate.middleware.js';
import { requireOnboardingStep } from '../middleware/onboarding.middleware.js';

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
