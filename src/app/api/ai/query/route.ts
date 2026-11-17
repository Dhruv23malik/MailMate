import { NextRequest, NextResponse } from 'next/server';
import { queryEmails } from '@/lib/ai';
import { AIQueryRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AIQueryRequest = await request.json();

    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await queryEmails(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Query Error:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}