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

    const clientView = await ClientViewModel.findOne({ token });

    if (!clientView) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (clientView.status === 'pending') {
      clientView.status = 'viewed';
      clientView.viewedAt = new Date();
      await clientView.save();
    }

    return NextResponse.json({
      success: true,
      status: clientView.status,
      viewedAt: clientView.viewedAt?.toISOString()
    });
  } catch (error) {
    console.error('Client View Track Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}