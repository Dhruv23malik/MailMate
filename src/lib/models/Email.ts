import mongoose, { Document, Schema } from 'mongoose';

export interface IEmail extends Document {
  messageId: string;
  threadId?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  snippet: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  category: 'assistant-reply' | 'client-reply' | 'no-reply' | 'unclassified';
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
  }>;
  headers: Record<string, string>;
  accountId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String },
}, { _id: false });

const emailSchema = new Schema<IEmail>({
  messageId: { type: String, required: true, unique: true, index: true },
  threadId: { type: String, index: true },
  from: { type: String, required: true, index: true },
  to: { type: String, required: true },
  subject: { type: String, required: true, index: 'text' },
  body: { type: String, required: true },
  bodyHtml: { type: String },
  snippet: { type: String, required: true },
  date: { type: Date, required: true, index: true },
  isRead: { type: Boolean, default: false, index: true },
  isStarred: { type: Boolean, default: false },
  labels: [{ type: String }],
  category: {
    type: String,
    enum: ['assistant-reply', 'client-reply', 'no-reply', 'unclassified'],
    default: 'unclassified',
    index: true
  },
  attachments: [attachmentSchema],
  headers: { type: Schema.Types.Mixed, default: {} },
  accountId: { type: Schema.Types.ObjectId, ref: 'EmailAccount', required: true, index: true },
}, {
  timestamps: true,
});

emailSchema.index({ accountId: 1, date: -1 });
emailSchema.index({ accountId: 1, category: 1 });
emailSchema.index({ accountId: 1, isRead: 1 });

export const EmailModel = mongoose.models.Email || mongoose.model<IEmail>('Email', emailSchema);