import mongoose, { Schema } from 'mongoose';

const SubscriptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
      index: true,
    },

    //  Denormalized plan name critical for analytics speed
    planName: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
      index: true,
    },

    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true },
);

// High-performance indexes for dashboard
SubscriptionSchema.index({ status: 1, createdAt: -1 });
SubscriptionSchema.index({ status: 1, startDate: -1 });
SubscriptionSchema.index({ user: 1, status: 1 });
SubscriptionSchema.index({ planName: 1, status: 1 });

export default mongoose.model('Subscription', SubscriptionSchema);
