export const ONBOARDING_STEPS = [
  'account',
  'profile',
  'workspace',
  'invite',
  'goal',
  'completed',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_CONFIG = {
  account: { required: true },
  profile: { required: true },
  workspace: { required: true },
  invite: { required: false },
  goal: { required: true },
  completed: { required: true },
} as const;
