"use client"

import { useState, useEffect, Suspense } from 'react';
import {
  Send, CheckCircle, Clock, Mail, User,
  Copy, ExternalLink, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ClientViewData {
  emailId: string;
  clientEmail: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'viewed' | 'replied';
  createdAt: string;
  updatedAt: string;
  token: string;
}

export default function ClientViewPage({ token }: { token: string }) {
  const [clientView, setClientView] = useState<ClientViewData | null>(null);
  const [response, setResponse] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'pending' | 'draft' | 'sent' | 'viewed' | 'replied'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client view data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/client/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('This link has expired or is invalid.');
          } else {
            setError('Failed to load email. Please try again.');
          }
          return;
        }
        const data = await res.json();
        setClientView(data);
        setStatus(data.status);
      } catch (err) {
        setError('Network error. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Track view when page loads
  useEffect(() => {
    if (clientView && status === 'pending') {
      // Mark as viewed
      fetch(`/api/client/${token}/view`, { method: 'POST' })
        .then(res => res.ok && setStatus('viewed'))
        .catch(console.error);
    }
  }, [clientView, status, token]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim() || isSending || !clientView) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/client/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) throw new Error('Failed to send response');

      setStatus('sent');
      setClientView({ ...clientView, status: 'sent', updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to send:', err);
      alert('Failed to send response. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !clientView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Unable to Load</h1>
          <p className="text-muted-foreground mb-6">{error || 'This link is invalid or has expired.'}</p>
          <p className="text-sm text-muted-foreground">Please contact the sender for a new link.</p>
        </Card>
      </div>
    );
  }

  const statusConfig: Record<'pending' | 'draft' | 'sent' | 'viewed' | 'replied', { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    pending: { label: 'Pending', icon: <Clock className="h-3.5 w-3.5" />, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
    draft: { label: 'Draft', icon: <Clock className="h-3.5 w-3.5" />, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
    sent: { label: 'Sent', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-950' },
    viewed: { label: 'Viewed', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-950' },
    replied: { label: 'Replied', icon: <Mail className="h-3.5 w-3.5" />, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-950' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Client Response Required</h1>
          <p className="text-muted-foreground">Please review the email below and provide your response</p>
        </div>

        {/* Status Badge */}
        <div className="mb-6 flex justify-center">
          <Badge variant="outline" className={cn('gap-1 text-lg px-4 py-2', currentStatus.color, currentStatus.bg)}>
            {currentStatus.icon}
            <span className="font-medium">{currentStatus.label}</span>
          </Badge>
        </div>

        {/* Original Email */}
        <Card className="mb-6 overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Original Email
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-medium text-xl">
                  {clientView.clientEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-medium">{clientView.clientEmail}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {new Date(clientView.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mt-1">{clientView.subject}</h3>
              </div>
            </div>

            <div className="p-4 bg-background rounded-lg border max-h-96 overflow-y-auto">
              <p className="whitespace-pre-wrap text-base leading-relaxed">{clientView.body}</p>
            </div>
          </div>
        </Card>

        {/* Response Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Response
            </h2>

            {status === 'draft' ? (
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <Label className="text-sm mb-1 block">Type your response below</Label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here... This will be sent directly to the sender."
                    className="min-h-[180px]"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isSending || !response.trim()}
                    className="flex-1 gap-2 text-lg py-3"
                    size="lg"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send Response
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Your response will be sent directly to the sender's email. The assistant will be CC'd for context.
                </p>
              </form>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-background rounded-lg border">
                  <h3 className="font-medium mb-2">Your Response (Sent)</h3>
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{response}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className={cn('flex items-center gap-1', currentStatus.color)}>
                    {currentStatus.icon}
                    Response sent on {new Date(clientView.updatedAt).toLocaleString()}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(response)} className="gap-1">
                    <Copy className="h-3.5 w-3.5" />
                    Copy Response
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <div className="p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              How this works
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Your response is sent directly to the original sender</li>
              <li>The sender will see this as a personal reply from you</li>
              <li>Your assistant is CC'd automatically for context</li>
              <li>You'll receive a confirmation when the email is delivered</li>
              <li>This link is single-use and expires after response</li>
            </ul>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Sent via AI Email Assistant</p>
          <p className="mt-1">This is a secure, one-time link for client responses.</p>
        </div>
      </div>
    </div>
  );
}