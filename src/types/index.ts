export interface Email {
  id: string;
  messageId: string;
  threadId?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  category: EmailCategory;
  attachments: Attachment[];
  headers: Record<string, string>;
}

export type EmailCategory = 'assistant-reply' | 'client-reply' | 'no-reply' | 'unclassified';

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  provider: 'gmail' | 'outlook' | 'imap';
  isActive: boolean;
  lastSynced?: string;
}

export interface AIQueryRequest {
  query: string;
  emailId?: string;
  threadId?: string;
  context?: Email[];
}

export interface AIQueryResponse {
  answer: string;
  confidence: number;
  sources: string[];
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: 'reply' | 'forward' | 'archive' | 'label' | 'schedule' | 'delegate';
  label: string;
  description: string;
  payload?: Record<string, unknown>;
}

export interface ClassificationResult {
  emailId: string;
  category: EmailCategory;
  confidence: number;
  reasoning: string;
  suggestedResponse?: string;
}

export interface DashboardStats {
  totalEmails: number;
  unreadCount: number;
  assistantReplyCount: number;
  clientReplyCount: number;
  noReplyCount: number;
  unclassifiedCount: number;
  todayEmails: number;
  thisWeekEmails: number;
}

export interface NotificationProfile {
  id: string;
  name: string;
  emailIds: string[];
  categories: EmailCategory[];
  isEnabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  channels: ('email' | 'push' | 'slack')[];
}

export interface ClientView {
  emailId: string;
  clientEmail: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'viewed' | 'replied';
  createdAt: string;
  updatedAt: string;
}