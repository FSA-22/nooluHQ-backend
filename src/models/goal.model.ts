import mongoose, { Schema } from 'mongoose';

const GoalSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    goalType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Goal', GoalSchema);
