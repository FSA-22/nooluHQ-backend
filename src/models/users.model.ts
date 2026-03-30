import { ONBOARDING_STEPS } from '../constants/onboarding.ts';
import mongoose from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const { Schema } = mongoose;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      select: false,
    },

    provider: {
      type: String,
      enum: ['credentials', 'google'],
      default: 'credentials',
      index: true,
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    onboardingStep: {
      type: String,
      enum: ONBOARDING_STEPS,
      default: 'account',
    },

    profile: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
    },

    country: {
      type: String,
      default: 'Unknown',
      index: true,
    },

    refreshToken: String,

    lastLoginAt: Date,
  },

  {
    timestamps: true,
  },
);

// compound indexes
userSchema.index({ createdAt: -1 });
userSchema.index({ country: 1, createdAt: -1 });

export type IUser = InferSchemaType<typeof userSchema>;

export default mongoose.model<IUser>('User', userSchema);
