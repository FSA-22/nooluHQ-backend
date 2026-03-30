import { ALLOWED_GOALS } from '../utils/goals.ts';
import mongoose, { Schema } from 'mongoose';

const GoalSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // enforce one goal per user
      index: true,
    },

    type: {
      type: String,
      enum: ALLOWED_GOALS,
      required: true,
      index: true,
    },

    // Optional: future-proofing
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

//  compound index (useful for analytics later)
GoalSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('Goal', GoalSchema);
