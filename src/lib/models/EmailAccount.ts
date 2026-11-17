import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailAccount extends Document {
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  provider: 'gmail' | 'outlook' | 'imap';
  isActive: boolean;
  lastSynced?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailAccountSchema = new Schema<IEmailAccount>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  provider: { type: String, enum: ['gmail', 'outlook', 'imap'], required: true },
  isActive: { type: Boolean, default: true, index: true },
  lastSynced: { type: Date },
}, {
  timestamps: true,
});

export const EmailAccountModel = mongoose.models.EmailAccount || mongoose.model<IEmailAccount>('EmailAccount', emailAccountSchema);