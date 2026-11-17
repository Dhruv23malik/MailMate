import { NextRequest, NextResponse } from 'next/server';
import { syncGmailAccount } from '@/lib/email-sync';
import connectDB from '@/lib/mongodb';
import { EmailAccountModel } from '@/lib/models/EmailAccount';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const accounts = await EmailAccountModel.find({ isActive: true });

    const results = await Promise.allSettled(
      accounts.map(account => syncGmailAccount({
        id: account._id.toString(),
        email: account.email,
        name: account.name,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        provider: account.provider,
        isActive: account.isActive,
        lastSynced: account.lastSynced?.toISOString(),
      }))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      synced: successful,
      failed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron Sync Error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}