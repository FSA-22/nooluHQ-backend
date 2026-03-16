import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  onboardingStep: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    onboardingStep: {
      type: String,
      enum: ['account', 'profile', 'workspace', 'goal', 'completed'],
      default: 'account',
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IUser>('User', userSchema);
