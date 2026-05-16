import mongoose, { Document, Model, Schema } from 'mongoose';

export type SessionType = 'jd' | 'role' | 'resume-analysis' | 'chat-import';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  sessionType: SessionType;
  inputData: Record<string, any>;
  generatedContent: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    sessionType: {
      type: String,
      required: true,
      enum: ['jd', 'role', 'resume-analysis', 'chat-import'],
    },
    inputData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generatedContent: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, createdAt: -1 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);
