import mongoose, { Schema } from 'mongoose';

const WorkspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Workspace', WorkspaceSchema);
