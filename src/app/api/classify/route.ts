import { NextRequest, NextResponse } from 'next/server';
import { classifyEmail, batchClassifyEmails } from '@/lib/ai';
import { Email } from '@/types';
import connectDB from '@/lib/mongodb';
import { EmailModel } from '@/lib/models/Email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailId, emailIds, email } = body;

    await connectDB();

    if (emailId) {
      // Classify single email by ID
      const emailDoc = await EmailModel.findById(emailId);
      if (!emailDoc) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }

      const emailData: Email = {
        id: emailDoc._id.toString(),
        messageId: emailDoc.messageId,
        threadId: emailDoc.threadId,
        from: emailDoc.from,
        to: emailDoc.to,
        subject: emailDoc.subject,
        body: emailDoc.body,
        bodyHtml: emailDoc.bodyHtml,
        snippet: emailDoc.snippet,
        date: emailDoc.date.toISOString(),
        isRead: emailDoc.isRead,
        isStarred: emailDoc.isStarred,
        labels: emailDoc.labels,
        category: emailDoc.category,
        attachments: emailDoc.attachments,
        headers: emailDoc.headers,
      };

      const result = await classifyEmail(emailData);

      // Update in database
      await EmailModel.findByIdAndUpdate(emailId, { category: result.category });

      return NextResponse.json(result);
    }

    if (emailIds && Array.isArray(emailIds)) {
      // Batch classify
      const emailDocs = await EmailModel.find({ _id: { $in: emailIds } });
      const emails: Email[] = emailDocs.map(doc => ({
        id: doc._id.toString(),
        messageId: doc.messageId,
        threadId: doc.threadId,
        from: doc.from,
        to: doc.to,
        subject: doc.subject,
        body: doc.body,
        bodyHtml: doc.bodyHtml,
        snippet: doc.snippet,
        date: doc.date.toISOString(),
        isRead: doc.isRead,
        isStarred: doc.isStarred,
        labels: doc.labels,
        category: doc.category,
        attachments: doc.attachments,
        headers: doc.headers,
      }));

      const results = await batchClassifyEmails(emails);

      // Update in database
      const updates = results.map(r => ({
        updateOne: {
          filter: { _id: r.emailId },
          update: { category: r.category }
        }
      }));
      await EmailModel.bulkWrite(updates);

      return NextResponse.json({ results });
    }

    if (email) {
      // Classify provided email object
      const result = await classifyEmail(email);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'emailId, emailIds, or email object is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Classification Error:', error);
    return NextResponse.json(
      { error: 'Failed to classify email' },
      { status: 500 }
    );
  }
}