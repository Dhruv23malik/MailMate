import { google } from 'googleapis';
import { Email, EmailAccount } from '@/types';
import { EmailModel } from './models/Email';
import { EmailAccountModel } from './models/EmailAccount';
import connectDB from './mongodb';

interface GmailMessage {
  id?: string | null;
  threadId?: string | null;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string; size?: number };
    parts?: GmailMessagePart[];
    mimeType?: string;
  };
  internalDate?: string;
}

interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: Array<{ name: string; value: string }>;
  body: { data?: string; size?: number; attachmentId?: string };
  parts?: GmailMessagePart[];
}

export async function syncGmailAccount(account: EmailAccount): Promise<{ synced: number; errors: string[] }> {
  await connectDB();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const errors: string[] = [];
  let synced = 0;

  try {
    // Get messages from last 30 days
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const query = `after:${thirtyDaysAgo}`;

    let pageToken: string | undefined;
    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100,
        pageToken,
      });

      const messages = response.data.messages || [];

      for (const msg of messages) {
        try {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
          });

          const email = parseGmailMessage(detail.data as GmailMessage, account.id);
          await upsertEmail(email);
          synced++;
        } catch (err) {
          errors.push(`Failed to sync message ${msg.id}: ${err}`);
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken && synced < 500); // Limit for demo

    // Update last synced
    await EmailAccountModel.findByIdAndUpdate(account.id, { lastSynced: new Date() });

  } catch (err) {
    errors.push(`Sync failed: ${err}`);
  }

  return { synced, errors };
}

function parseGmailMessage(message: GmailMessage, accountId: string): Email {
  const payload = message.payload || { headers: [] };
  const headers = Object.fromEntries(
    (payload.headers || []).map(h => [h.name.toLowerCase(), h.value])
  );

  const body = extractBody(payload);
  const bodyHtml = extractHtmlBody(payload);
  const attachments = extractAttachments(payload);
  const messageId = message.id || headers['message-id'] || `msg-${Date.now()}`;

  return {
    id: messageId,
    messageId: headers['message-id'] || messageId,
    threadId: message.threadId || '',
    from: headers['from'] || '',
    to: headers['to'] || '',
    subject: headers['subject'] || '(No Subject)',
    body,
    bodyHtml,
    snippet: message.snippet || '',
    date: message.internalDate ? new Date(parseInt(message.internalDate)).toISOString() : new Date().toISOString(),
    isRead: !message.labelIds?.includes('UNREAD'),
    isStarred: message.labelIds?.includes('STARRED') || false,
    labels: message.labelIds || [],
    category: 'unclassified',
    attachments,
    headers,
  };
}

function extractBody(payload: GmailMessage['payload']): string {
  if (!payload) return '';
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        const nested = extractBody({ ...payload, parts: part.parts } as any);
        if (nested) return nested;
      }
    }
  }
  return '';
}

function extractHtmlBody(payload: GmailMessage['payload']): string | undefined {
  if (!payload) return undefined;
  if (payload.body?.data && payload.mimeType === 'text/html') {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        const nested = extractHtmlBody({
          headers: payload.headers,
          body: payload.body,
          parts: part.parts,
          mimeType: part.mimeType
        } as any);
        if (nested) return nested;
      }
    }
  }
  return undefined;
}

function extractAttachments(payload: GmailMessage['payload']): Email['attachments'] {
  const attachments: Email['attachments'] = [];
  if (!payload) return attachments;

  function processPart(part: GmailMessagePart) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      part.parts.forEach(processPart);
    }
  }

  if (payload.parts) {
    payload.parts.forEach(processPart);
  }

  return attachments;
}

async function upsertEmail(email: Email) {
  await EmailModel.findOneAndUpdate(
    { messageId: email.messageId },
    { ...email, accountId: email.id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function getGmailAuthUrl(): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}