import mongoose, { Schema } from 'mongoose';

const PlanSchema = new Schema({
  name: String,
  price: Number,
});

export default mongoose.model('Plan', PlanSchema);
