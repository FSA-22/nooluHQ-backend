import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Profile from '../models/profile.model.js';
import User from '../models/users.model.js';

export const createOrUpdateProfile = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { name, role, teamSize } = req.body;

    if (!name || !role || !teamSize) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Name, role, and teamSize are required' });
    }

    // Ensure user exists
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }

    // Upsert profile (FIX: include teamSize)
    const profile = await Profile.findOneAndUpdate(
      { user: userId },
      {
        name,
        role,
        teamSize,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        session,
      },
    );

    // 🔥 Sync name into User (KEY CHANGE)
    user.name = name;

    // Advance onboarding step
    if (user.onboardingStep === 'profile') {
      user.onboardingStep = 'workspace';
    }

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: 'Profile saved successfully',
      profile,
      nextStep: 'workspace',
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error('Profile error:', error);

    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};
