import { NextRequest, NextResponse } from 'next/server';
import { syncGmailAccount, getGmailAuthUrl, exchangeCodeForTokens } from '@/lib/email-sync';
import connectDB from '@/lib/mongodb';
import { EmailAccountModel } from '@/lib/models/EmailAccount';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, accountId, code } = body;

    await connectDB();

    if (action === 'auth-url') {
      const authUrl = await getGmailAuthUrl();
      return NextResponse.json({ authUrl });
    }

    if (action === 'exchange-code' && code) {
      const tokens = await exchangeCodeForTokens(code);
      return NextResponse.json({ tokens });
    }

    if (action === 'sync' && accountId) {
      const account = await EmailAccountModel.findById(accountId);
      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      const result = await syncGmailAccount({
        id: account._id.toString(),
        email: account.email,
        name: account.name,
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        provider: account.provider,
        isActive: account.isActive,
        lastSynced: account.lastSynced?.toISOString(),
      });

      return NextResponse.json(result);
    }

    if (action === 'sync-all') {
      const accounts = await EmailAccountModel.find({ isActive: true });
      const results = await Promise.all(
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

      return NextResponse.json({ results });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: auth-url, exchange-code, sync, or sync-all' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Email Sync Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const accounts = await EmailAccountModel.find({ isActive: true }).select('-accessToken -refreshToken');
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Get Accounts Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}