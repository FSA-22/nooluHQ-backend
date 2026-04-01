import mongoose, { Schema } from 'mongoose';

const WorkspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    teammates: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },

        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },

        status: {
          type: String,
          enum: ['pending', 'joined'],
          default: 'pending',
        },

        inviteToken: {
          type: String,
        },

        inviteExpires: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true },
);

WorkspaceSchema.index({ owner: 1 }, { unique: true });

export default mongoose.model('Workspace', WorkspaceSchema);
