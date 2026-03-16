import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/users.model.ts';
import Otp from '../models/otp.model.ts';
import sendEmail from '../utils/sendEmail.ts';
import mongoose from 'mongoose';

// Register Account + send OTP

export const registerAccount = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword, onboardingStep: 'account' });
    await user.save({ session });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otpDoc = new Otp({
      user: user._id,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await otpDoc.save({ session });

    //  Commit DB changes first
    await session.commitTransaction();
    session.endSession();

    //  Then send email (outside transaction)
    try {
      await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otpCode}`);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      // Optionally: trigger a retry mechanism or mark OTP as "unsent"
    }

    return res.status(201).json({ message: 'Account created. OTP sent.', userId: user._id });
  } catch (err) {
    console.error(err);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    return res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required.' });
      return;
    }

    const user = await User.findOne({ email }).session(session);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const otpDoc = await Otp.findOne({ user: user._id, otp }).session(session);
    if (!otpDoc) {
      res.status(400).json({ message: 'Invalid OTP.' });
      return;
    }

    if (otpDoc.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpDoc._id }).session(session); // cleanup expired OTP
      res.status(400).json({ message: 'OTP has expired.' });
      return;
    }

    // OTP is valid → update onboarding step
    user.onboardingStep = 'profile';
    await user.save({ session });

    // Generate temporary access token
    const accessToken = crypto.randomBytes(20).toString('hex');
    otpDoc.accessToken = accessToken;
    await otpDoc.save({ session });

    // Remove OTP so it cannot be reused
    await Otp.deleteOne({ _id: otpDoc._id }).session(session);

    await session.commitTransaction();
    res.status(200).json({
      message: 'OTP verified successfully.',
      accessToken,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    session.endSession();
  }
};
