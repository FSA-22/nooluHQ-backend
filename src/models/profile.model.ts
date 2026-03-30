import mongoose, { Schema } from 'mongoose';

const ProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one-to-one relationship
      index: true,
    },

    name: {
      type: String,
      trim: true,
    },
    teamSize: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Profile', ProfileSchema);
