import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ClientViewPage from './ClientViewPage';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  return {
    title: 'Client Response Required',
    description: 'Please review and respond to this email',
    robots: 'noindex, nofollow',
  };
}

export default async function ClientViewRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="animate-spin h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" /><p className="text-muted-foreground">Loading...</p></div></div>}>
      <ClientViewPage token={token} />
    </Suspense>
  );
}