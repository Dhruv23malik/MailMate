import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClientViewModel } from '@/lib/models/ClientView';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;

    const clientView = await ClientViewModel.findOne({ token, status: { $ne: 'replied' } });

    if (!clientView) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if expired (7 days)
    const createdAt = new Date(clientView.createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    return NextResponse.json({
      emailId: clientView.emailId,
      clientEmail: clientView.clientEmail,
      subject: clientView.subject,
      body: clientView.body,
      status: clientView.status,
      createdAt: clientView.createdAt.toISOString(),
      updatedAt: clientView.updatedAt.toISOString(),
      token: clientView.token,
    });
  } catch (error) {
    console.error('Client View GET Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}