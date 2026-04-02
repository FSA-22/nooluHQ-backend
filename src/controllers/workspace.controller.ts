import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Workspace from '../models/workspace.model.js';
import sendEmail from '../utils/sendEmail.js';

import User from '../models/users.model.js';
import { FRONTEND_URL } from '../config/env.js';

export const createWorkspace = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.id;

    const { name } = req.body;

    console.log('name', name);

    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!name) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const existingWorkspace = await Workspace.findOne({ owner: userId }).session(session);

    if (existingWorkspace) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Workspace already exists' });
    }

    const workspace = await Workspace.create(
      [
        {
          name,
          owner: userId,
          teammates: [],
        },
      ],
      { session },
    );

    //  ADVANCE STEP
    await User.findByIdAndUpdate(userId, { onboardingStep: 'invite' }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: 'Workspace created',
      workspace: workspace[0],
      nextStep: 'invite',
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: 'Failed to create workspace',
      error: error.message,
    });
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const workspace = await Workspace.findOne({
      'teammates.inviteToken': token,
      'teammates.inviteExpires': { $gt: new Date() },
    });

    if (!workspace) {
      return res.status(400).json({ message: 'Invalid or expired invite' });
    }

    const teammate = workspace.teammates.find((t) => t.inviteToken === token);

    if (!teammate) {
      return res.status(400).json({ message: 'Invite not found' });
    }

    if (teammate.user) {
      return res.status(400).json({ message: 'Invite already used' });
    }

    // Convert string → ObjectId
    teammate.user = new mongoose.Types.ObjectId(userId);

    teammate.status = 'joined';
    teammate.inviteToken = undefined;
    teammate.inviteExpires = undefined;

    await workspace.save();

    return res.status(200).json({
      message: 'Joined workspace successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to accept invite',
      error: error.message,
    });
  }
};

export const inviteTeammate = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { emails } = req.body as { emails: string[] };

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const workspace = await Workspace.findOne({ owner: userId });
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const normalizedEmails = [...new Set((emails || []).map((e) => e.trim().toLowerCase()))];

    const invited: string[] = [];
    const skipped: string[] = [];

    const existingEmails = new Set(workspace.teammates.map((t) => t.email.toLowerCase()));

    const emailPromises = normalizedEmails.map(async (email) => {
      if (existingEmails.has(email)) {
        skipped.push(email);
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');

      workspace.teammates.push({
        email,
        inviteToken: token,
        inviteExpires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'pending',
      });

      const inviteLink = `${FRONTEND_URL}/invite/${token}`;

      try {
        await sendEmail(email, "You're invited to join a workspace", `Click: ${inviteLink}`);
        invited.push(email);
      } catch {
        console.error(`Failed to send email to ${email}`);
      }
    });

    await Promise.all(emailPromises);
    await workspace.save();

    //  Advance onboarding step for the user
    await User.findByIdAndUpdate(userId, { onboardingStep: 'goal' });

    return res.status(200).json({
      message: 'Invites processed',
      invited,
      skipped,
      nextStep: 'goal',
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Failed to send invites',
      error: error.message,
    });
  }
};
