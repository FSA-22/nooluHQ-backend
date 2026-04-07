import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Goal from '../models/goal.model.js';
import Subscription from '../models/subscription.model.js';
import Plan from '../models/plan.model.js';
import User from '../models/users.model.js';
import workspaceModel from '../models/workspace.model.js';
import { ALLOWED_GOALS } from '../utils/goals.js';

export const createGoal = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { focusId } = req.body;

    if (!focusId || !ALLOWED_GOALS.includes(focusId)) {
      return res.status(400).json({ message: 'Invalid goal type' });
    }

    const user = await User.findById(req.user.id).session(session);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const workspace = await workspaceModel.findOne({ owner: user._id }).session(session);
    if (!workspace) {
      return res.status(400).json({ message: 'Workspace required' });
    }

    const existingGoal = await Goal.findOne({ user: user._id }).session(session);
    if (existingGoal) {
      return res.status(400).json({ message: 'Goal already set for this user' });
    }

    // ✅ Create goal
    const [goal] = await Goal.create([{ user: user._id, type: focusId }], { session });

    // ✅ Ensure free plan exists (FIXED)
    let freePlan = await Plan.findOne({ name: 'free' }).session(session);

    if (!freePlan) {
      const createdPlans = await Plan.create(
        [
          {
            name: 'free',
            price: 0,
            billingCycle: 'monthly',
            features: ['basic_access'],
          },
        ],
        { session },
      );

      freePlan = createdPlans[0] ?? null; // ✅ critical fix
    }

    // ✅ Safety guard (important)
    if (!freePlan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: 'Failed to initialize free plan' });
    }

    // ✅ Create subscription
    const existingSubscription = await Subscription.findOne({ user: user._id }).session(session);

    if (!existingSubscription) {
      await Subscription.create(
        [
          {
            user: user._id,
            plan: freePlan._id,
            planName: freePlan.name,
            amount: freePlan.price,
            billingCycle: freePlan.billingCycle,
            startDate: new Date(),
            endDate: null,
            status: 'active',
          },
        ],
        { session },
      );
    }

    // ✅ Complete onboarding
    user.onboardingStep = 'completed';
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Onboarding completed',
      goal,
      user,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    console.error('Goal creation error:', error);

    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};
