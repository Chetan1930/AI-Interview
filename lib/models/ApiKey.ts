import mongoose, { Schema, Document } from 'mongoose';
import type { AIProvider } from '@/lib/provider-types';

export type { AIProvider };

export interface IApiKey extends Document {
  userId: mongoose.Types.ObjectId;
  provider: AIProvider;
  encryptedKey: string;
  label: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: {
      type: String,
      enum: ['gemini', 'openai', 'claude'] as AIProvider[],
      required: true,
    },
    encryptedKey: { type: String, required: true },
    label: { type: String, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure only one default per user per provider
ApiKeySchema.index({ userId: 1, provider: 1, isDefault: 1 });

export const ApiKey =
  (mongoose.models.ApiKey as mongoose.Model<IApiKey>) ||
  mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
