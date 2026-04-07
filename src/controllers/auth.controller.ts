import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/users.model.js';
import Otp from '../models/otp.model.js';
import sendEmail from '../utils/sendEmail.js';
import mongoose from 'mongoose';
import geoip from 'geoip-lite';
import { OAuth2Client } from 'google-auth-library';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens.js';
import type { PopulatedUser } from '../types/user.js';
import { GOOGLE_CLIENT_ID } from '../config/env.js';
import { randomUUID } from 'node:crypto';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const detectCountry = (req: Request): string => {
  const headerCountry = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'];

  if (headerCountry && typeof headerCountry === 'string') {
    return headerCountry;
  }

  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

  const geo = geoip.lookup(ip);
  return geo?.country || 'Unknown';
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      ...(process.env.GOOGLE_CLIENT_ID && {
        audience: process.env.GOOGLE_CLIENT_ID,
      }),
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    const { email, name, picture, sub } = payload;

    // Continue your logic (find/create user, issue tokens...)

    return res.status(200).json({
      message: 'Google login successful',
      data: { email, name, picture, sub },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Google authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
export const loginAccount = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // --- populate profile ---
    const user = await User.findOne({ email }).select('+password').populate<{
      profile: { name: string; role: string };
    }>('profile');

    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const accessToken = generateAccessToken({ userId: user._id.toString() });
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    // store hashed refresh token in user

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        onboardingStep: user.onboardingStep,
        name: user.profile?.name || null,
        role: user.profile?.role || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const registerAccount = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      throw new Error('All fields are required.');
    }

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      throw new Error('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const country = detectCountry(req);

    const user = new User({
      email,
      password: hashedPassword,
      onboardingStep: 'account',
      lastLoginAt: new Date(),
      isEmailVerified: false,
      country,
    });

    await user.save({ session });

    //  CREATE SESSION ID
    const sessionId = randomUUID();

    //  CREATE OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create(
      [
        {
          user: user._id,
          otp: otpCode,
          sessionId,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    //  SEND EMAIL (async)
    sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otpCode}`).catch(console.error);

    return res.status(201).json({
      message: 'Account created. OTP sent.',
      sessionId, // CRITICAL
      otp: otpCode,
    });
  } catch (err: any) {
    await session.abortTransaction();

    return res.status(400).json({
      message: err.message || 'Registration failed',
    });
  } finally {
    session.endSession();
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { otp, sessionId } = req.body;

    if (!otp || !sessionId) {
      res.status(400).json({ message: 'OTP and session are required.' });
      return;
    }

    const otpDoc = await Otp.findOne({
      otp,
      sessionId,
    }).session(session);

    if (!otpDoc) {
      res.status(400).json({ message: 'Invalid OTP.' });
      return;
    }

    if (otpDoc.expiresAt < new Date()) {
      res.status(400).json({ message: 'OTP expired.' });
      return;
    }

    //  BRUTE FORCE PROTECTION
    if (otpDoc.attempts >= 5) {
      res.status(429).json({ message: 'Too many attempts.' });
      return;
    }

    const user = await User.findById(otpDoc.user).session(session);

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    if (user.onboardingStep !== 'account') {
      res.status(400).json({ message: 'Invalid onboarding step.' });
      return;
    }

    //  SUCCESS → UPDATE USER
    user.isEmailVerified = true;
    user.onboardingStep = 'profile';

    await user.save({ session });

    //  DELETE OTP SESSION
    await Otp.deleteMany({ sessionId }).session(session);

    //  GENERATE TOKENS
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    await session.commitTransaction();

    res.status(200).json({
      message: 'OTP verified successfully.',
      nextStep: 'profile',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    session.endSession();
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { sessionId } = req.body;

    console.log('Resend OTP request for session:', sessionId);

    if (!sessionId) {
      return res.status(400).json({ message: 'Session is required.' });
    }

    const existingOtp = await Otp.findOne({ sessionId }).sort({ createdAt: -1 }).session(session);

    if (!existingOtp) {
      return res.status(404).json({
        message: 'Session expired. Please restart signup.',
      });
    }

    //  RATE LIMIT (30s)
    if (Date.now() - new Date(existingOtp.createdAt).getTime() < 30000) {
      return res.status(429).json({
        message: 'Please wait before requesting another OTP.',
      });
    }

    const user = await User.findById(existingOtp.user).session(session);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.onboardingStep !== 'account') {
      return res.status(400).json({
        message: 'OTP already verified or invalid step.',
      });
    }

    // ✅ DELETE OLD OTPs
    await Otp.deleteMany({ sessionId }).session(session);

    // ✅ CREATE NEW OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.create(
      [
        {
          user: user._id,
          otp: otpCode,
          sessionId,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // ✅ SEND EMAIL
    sendEmail(user.email, 'Your OTP Code', `Your OTP code is: ${otpCode}`).catch(console.error);

    return res.status(200).json({
      message: 'OTP resent successfully.',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: 'Internal server error.',
    });
  }
};
