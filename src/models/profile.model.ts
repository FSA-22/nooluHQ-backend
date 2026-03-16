import mongoose, { Schema } from 'mongoose';

const ProfileSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    firstName: String,
    lastName: String,
    phone: String,
  },
  { timestamps: true },
);

export default mongoose.model('Profile', ProfileSchema);
