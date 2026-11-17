"use client"

import { useState, useEffect } from 'react';
import {
  X, Send, CheckCircle, Clock, Mail, User,
  ArrowLeft, Copy, ExternalLink, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClientView } from '@/types';
import { cn } from '@/lib/utils';

interface ClientViewProps {
  clientView: ClientView | null;
  onClose: () => void;
  onSend: (response: string) => void;
}

export function ClientViewModal({ clientView, onClose, onSend }: ClientViewProps) {
  const [response, setResponse] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'pending' | 'draft' | 'sent' | 'viewed' | 'replied'>('draft');

  useEffect(() => {
    if (clientView) {
      setStatus(clientView.status);
    }
  }, [clientView]);

  if (!clientView) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSend(response);
      setStatus('sent');
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setIsSending(false);
    }
  };

  const statusConfig: Record<'pending' | 'draft' | 'sent' | 'viewed' | 'replied', { label: string; icon: React.ReactNode; color: string }> = {
    pending: { label: 'Pending', icon: <Clock className="h-3.5 w-3.5" />, color: 'text-gray-500' },
    draft: { label: 'Draft', icon: <Clock className="h-3.5 w-3.5" />, color: 'text-gray-500' },
    sent: { label: 'Sent', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-blue-500' },
    viewed: { label: 'Viewed', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-green-500' },
    replied: { label: 'Replied', icon: <Mail className="h-3.5 w-3.5" />, color: 'text-purple-500' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-lg">Client Response Required</h2>
              <p className="text-sm text-muted-foreground">{clientView.clientEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('gap-1', currentStatus.color)}>
              {currentStatus.icon}
              <span>{currentStatus.label}</span>
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Original Email Context */}
          <Card className="bg-muted/30 border-border/50">
            <div className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Original Email
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">Subject:</span>
                  <span className="font-medium">{clientView.subject}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-24 shrink-0">From:</span>
                  <span>{clientView.clientEmail}</span>
                </div>
              </div>
              <div className="mt-3 p-3 bg-background rounded-lg border max-h-48 overflow-y-auto">
                <p className="whitespace-pre-wrap text-sm">{clientView.body}</p>
              </div>
            </div>
          </Card>

          {/* Client Response Form */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Response
                </h3>
                {status === 'draft' && (
                  <Badge variant="warning" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Action Required
                  </Badge>
                )}
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <Label className="text-sm">Your Response</Label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response here... The client will receive this directly."
                    className="mt-1 min-h-[150px]"
                    disabled={status !== 'draft'}
                    required
                  />
                </div>

                {status === 'draft' ? (
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={isSending || !response.trim()} className="flex-1 gap-2">
                      {isSending ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Response
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                    <span className={cn('flex items-center gap-1', currentStatus.color)}>
                      {currentStatus.icon}
                      Response {status === 'sent' ? 'sent' : status === 'viewed' ? 'viewed' : 'replied'} at {new Date(clientView.updatedAt).toLocaleString()}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(response)} className="gap-1">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
                      <X className="h-3.5 w-3.5" />
                      Close
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <div className="p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                How this works
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Your response will be sent directly to the client's email</li>
                <li>The client will see this as a personal reply from you</li>
                <li>The assistant will be CC'd for context</li>
                <li>You can track when the client views or replies</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}