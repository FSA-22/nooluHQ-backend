import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },

    status: {
      type: String,
      enum: ['active', 'cancelled'],
    },
  },
  { timestamps: true },
);

export default mongoose.model('Subscription', SubscriptionSchema);
