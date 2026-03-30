import mongoose, { Schema } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const PlanSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
      index: true,
    },

    features: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

//  index for analytics
PlanSchema.index({ price: 1, billingCycle: 1 });

export type IPlan = InferSchemaType<typeof PlanSchema>;

export default mongoose.model<IPlan>('Plan', PlanSchema);
