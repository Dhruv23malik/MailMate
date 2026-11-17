import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClientViewModel } from '@/lib/models/ClientView';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;
    const { response } = await request.json();

    if (!response || !response.trim()) {
      return NextResponse.json({ error: 'Response is required' }, { status: 400 });
    }

    const clientView = await ClientViewModel.findOne({ token, status: { $in: ['pending', 'viewed'] } });

    if (!clientView) {
      return NextResponse.json({ error: 'Not found or already responded' }, { status: 404 });
    }

    // In production, this would send the actual email via Gmail API
    // For demo, we'll just update the status
    clientView.status = 'sent';
    clientView.response = response;
    clientView.sentAt = new Date();
    await clientView.save();

    // TODO: Actually send email via Gmail API
    // await sendEmailViaGmail(clientView.clientEmail, clientView.subject, response);

    return NextResponse.json({
      success: true,
      status: 'sent',
      sentAt: clientView.sentAt.toISOString()
    });
  } catch (error) {
    console.error('Client Respond Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}