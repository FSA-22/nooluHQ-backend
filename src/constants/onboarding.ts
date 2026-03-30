export const ONBOARDING_STEPS = [
  'account',
  'profile',
  'workspace',
  'invite',
  'goal',
  'completed',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
