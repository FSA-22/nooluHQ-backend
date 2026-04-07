import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  user: mongoose.Types.ObjectId;
  otp: string;
  sessionId: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

//  TTL index
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

//  Prevent duplicate session per user
otpSchema.index({ user: 1, sessionId: 1 }, { unique: true });

//  Fast OTP lookup
otpSchema.index({ sessionId: 1, otp: 1 });

export default mongoose.model<IOtp>('Otp', otpSchema);
