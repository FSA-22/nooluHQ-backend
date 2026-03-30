import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Goal from '../models/goal.model.ts';
import Subscription from '../models/subscription.model.ts';
import Plan from '../models/plan.model.ts';
import User from '../models/users.model.ts';
import workspaceModel from '../models/workspace.model.ts';
import { ALLOWED_GOALS } from '../utils/goals.ts';

export const createGoal = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { focusId } = req.body;

    console.log('Forwarding focusId:', focusId);
    console.log('Forwarding req.user:', req.body);

    // Validate goal type

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

    // Prevent duplicate goal creation
    const existingGoal = await Goal.findOne({ user: user._id }).session(session);
    if (existingGoal) {
      return res.status(400).json({ message: 'Goal already set for this user' });
    }

    // Create goal
    const goal = await Goal.create([{ user: user._id, type: focusId }], { session });

    // Ensure free plan exists
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
      freePlan = createdPlans[0];
    }

    // Create subscription for free plan if not exists
    const existingSubscription = await Subscription.findOne({ user: user._id }).session(session);

    if (!existingSubscription && freePlan) {
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

    // Complete onboarding
    user.onboardingStep = 'completed';
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Onboarding completed',
      goal: goal[0],
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
