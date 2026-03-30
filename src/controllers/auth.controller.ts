import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/users.model.ts';
import Otp from '../models/otp.model.ts';
import sendEmail from '../utils/sendEmail.ts';
import mongoose from 'mongoose';
import geoip from 'geoip-lite';
import { OAuth2Client } from 'google-auth-library';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens.ts';
import type { PopulatedUser } from '../types/user.ts';
import { GOOGLE_CLIENT_ID } from '../config/env.ts';

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

export const registerAccount = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, password, confirmPassword } = req.body;

    console.log(' req.body', req.body);

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

    const country = detectCountry(req);

    console.log('Detected country:', country);

    const user = new User({
      email,
      password: hashedPassword,
      onboardingStep: 'account',
      isEmailVerified: false,
      country,
    });
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

    //  Then send email
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

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'ID token required' });
    }

    // 1. Verify Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email || !email_verified) {
      return res.status(401).json({ message: 'Email not verified' });
    }

    const country = detectCountry(req);

    // 2. Find user
    let user = (await User.findOne({ email }).populate('profile')) as PopulatedUser | null;

    // 3. Create user if not exists
    if (!user) {
      user = (await User.create({
        email,
        googleId,
        provider: 'google',
        isEmailVerified: true,
        onboardingStep: 'profile', // skip account + email verify
        country,
        lastLoginAt: new Date(),
      })) as PopulatedUser;
    } else {
      // 4. Update existing user
      user.googleId = googleId;
      user.isEmailVerified = true;
      user.lastLoginAt = new Date();

      await user.save();
    }

    // 5. Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
    });

    // 6. Persist refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();

    // 7. Response
    return res.status(200).json({
      message: 'Google login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        onboardingStep: user.onboardingStep,
        name: user.profile?.name || name || null,
        role: user.profile?.role || null,
        picture: picture || null,
        country: user.country,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { otp } = req.body;

    if (!otp) {
      res.status(400).json({ message: 'OTP is required.' });
      return;
    }

    // Find OTP first
    const otpDoc = await Otp.findOne({ otp }).sort({ createdAt: -1 }).session(session);

    if (!otpDoc) {
      res.status(400).json({ message: 'Invalid OTP.' });
      return;
    }

    if (otpDoc.expiresAt < new Date()) {
      res.status(400).json({ message: 'OTP has expired.' });
      return;
    }

    // Get user
    const user = await User.findById(otpDoc.user).session(session);

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    // Enforce onboarding flow
    if (user.onboardingStep !== 'account') {
      res.status(400).json({ message: 'OTP already verified or invalid step.' });
      return;
    }

    // Mark verified
    user.isEmailVerified = true;
    user.onboardingStep = 'profile';

    await user.save({ session });

    // Delete OTP AFTER successful validation
    await Otp.deleteOne({ _id: otpDoc._id }).session(session);

    // Generate tokens
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
    console.error('Error verifying OTP:', error);

    res.status(500).json({ message: 'Internal server error.' });
  } finally {
    session.endSession();
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email }).session(session);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Only allow resending if user hasn't finished OTP step
    if (user.onboardingStep !== 'account') {
      return res.status(400).json({ message: 'OTP already verified or invalid step.' });
    }

    // Delete any previous OTPs
    await Otp.deleteMany({ user: user._id }).session(session);

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otpDoc = new Otp({
      user: user._id,
      otp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
    });

    await otpDoc.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Send OTP email
    try {
      await sendEmail(email, 'Your OTP Code', `Your OTP code is: ${otpCode}`);
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
      // Optionally: handle retry or log
    }

    return res.status(200).json({ message: 'OTP resent successfully.' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error resending OTP:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
