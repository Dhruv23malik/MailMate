import mongoose, { Document, Schema } from 'mongoose';

export interface IClientView extends Document {
  emailId: string;
  clientEmail: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'viewed' | 'replied';
  token: string;
  response?: string;
  sentAt?: Date;
  viewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clientViewSchema = new Schema<IClientView>({
  emailId: { type: String, required: true, index: true },
  clientEmail: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'viewed', 'replied'],
    default: 'pending',
    index: true
  },
  token: { type: String, required: true, unique: true, index: true },
  response: { type: String },
  sentAt: { type: Date },
  viewedAt: { type: Date },
}, {
  timestamps: true,
});

// TTL index - expire after 7 days
clientViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const ClientViewModel = mongoose.models.ClientView || mongoose.model<IClientView>('ClientView', clientViewSchema);