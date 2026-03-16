import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  user: mongoose.Types.ObjectId;
  otp: string;
  expiresAt: Date;
  accessToken?: string;
}

const otpSchema = new Schema<IOtp>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    accessToken: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IOtp>('Otp', otpSchema);
