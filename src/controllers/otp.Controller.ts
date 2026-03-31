import { Request, Response } from 'express';
import Otp from '../models/otp.model.js';
import User from '../models/users.model.js';
import mongoose from 'mongoose';

export const verifyOtp = async (req: Request, res: Response) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: 'User ID and OTP are required' });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }

  try {
    // Find OTP record for the user
    const otpRecord = await Otp.findOne({ user: userId, otp });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check expiration
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id }); // remove expired OTP
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Optional: mark user as verified
    await User.findByIdAndUpdate(userId, { isVerified: true });

    // Delete OTP after successful verification
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// export const resendOtp =  async (req: Request, res: Response): Promise<Response> => {
//   const { userId } = req.body;

//   if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

//   try {
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ success: false, message: 'User not found' });

//     // Delete old OTPs
//     await Otp.deleteMany({ user: userId });

//     // Generate new OTP
//     const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

//     await Otp.create({ user: user._id, otp: otpCode, expiresAt });

//     // TODO: send OTP via email
//     console.log(`OTP for ${user.email}: ${otpCode}`);

//     res.json({ success: true, message: 'OTP sent successfully' });
//   } catch (err) {
//     console.error('Resend OTP error:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });
