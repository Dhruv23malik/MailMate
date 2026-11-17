"use client"

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft, Star, Reply, Forward, Archive, Flag, MoreVertical,
  Bot, Sparkles, Copy, Check, Loader2, Paperclip, ChevronDown, ChevronUp, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Email, EmailCategory } from '@/types';
import { cn } from '@/lib/utils';

interface AIQueryResult {
  answer: string;
  confidence: number;
  sources: string[];
  suggestedActions?: Array<{type: string; label: string; description: string}>;
}

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onClassify: (emailId: string, category: EmailCategory) => void;
  onQuery: (query: string) => Promise<AIQueryResult>;
  onGenerateResponse: (instruction: string) => Promise<string>;
}

export function EmailDetail({ email, onBack, onClassify, onQuery, onGenerateResponse }: EmailDetailProps) {
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIQueryResult | null>(null);
  const [queryInput, setQueryInput] = useState('');
  const [showGeneratedResponse, setShowGeneratedResponse] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseInstruction, setResponseInstruction] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showFullBody, setShowFullBody] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiResponse, generatedResponse]);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || !email) return;

    setIsAILoading(true);
    try {
      const response = await onQuery(queryInput);
      setAiResponse(response);
    } catch (err) {
      console.error('Query failed:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseInstruction.trim() || !email) return;

    setIsGenerating(true);
    try {
      const response = await onGenerateResponse(responseInstruction);
      setGeneratedResponse(response);
      setShowGeneratedResponse(true);
    } catch (err) {
      console.error('Generate response failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select an email to view details</p>
        </div>
      </div>
    );
  }

  const categoryConfig: Record<EmailCategory, { label: string; variant: 'assistant' | 'client' | 'noreply' | 'default'; icon: React.ReactNode }> = {
    'assistant-reply': { label: 'Assistant Reply', variant: 'assistant', icon: <Bot className="h-3 w-3" /> },
    'client-reply': { label: 'Client Reply Required', variant: 'client', icon: <Flag className="h-3 w-3" /> },
    'no-reply': { label: 'No Reply Needed', variant: 'noreply', icon: <Archive className="h-3 w-3" /> },
    'unclassified': { label: 'Unclassified', variant: 'default', icon: <Sparkles className="h-3 w-3" /> },
  };

  const config = categoryConfig[email.category];
  const senderName = email.from.includes('<')
    ? email.from.split('<')[0].trim().replace(/"/g, '')
    : email.from.split('@')[0];
  const senderEmail = email.from.includes('<')
    ? email.from.split('<')[1].replace('>', '').trim()
    : email.from;

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 lg:pl-4">
          <h1 className="text-xl font-semibold truncate">{email.subject}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>{senderName}</span>
            <span>•</span>
            <span>{senderEmail}</span>
            <span>•</span>
            <span>{format(new Date(email.date), 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
          </Badge>
          <Button variant="ghost" size="icon" onClick={() => onClassify(email.id, 'assistant-reply')} title="Assistant Reply">
            <Bot className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onClassify(email.id, 'client-reply')} title="Client Reply">
            <Flag className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onClassify(email.id, 'no-reply')} title="No Reply">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Email Body */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Sender Info Card */}
            <Card className="bg-muted/30 border-border/50">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">
                      {senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{senderName}</p>
                    <p className="text-sm text-muted-foreground">{senderEmail}</p>
                  </div>
                  <span className="flex-1" />
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Reply className="h-3.5 w-3.5" />
                    Reply
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Forward className="h-3.5 w-3.5" />
                    Forward
                  </Button>
                </div>
              </div>
            </Card>

            {/* Email Body */}
            <Card>
              <div className="p-6">
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap font-sans">
                  {showFullBody ? email.body : email.body.substring(0, 500)}
                </div>
                {email.body.length > 500 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-primary"
                    onClick={() => setShowFullBody(!showFullBody)}
                  >
                    {showFullBody ? (
                      <>Show less <ChevronUp className="h-4 w-4" /></>
                    ) : (
                      <>Show more <ChevronDown className="h-4 w-4" /></>
                    )}
                  </Button>
                )}
              </div>
            </Card>

            {/* Attachments */}
            {email.attachments.length > 0 && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {email.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span>{att.filename}</span>
                        <span className="text-muted-foreground">({(att.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* AI Assistant Section */}
            <Card className="border-primary/20 bg-primary/5">
              <div className="p-4">
                <h3 className="font-medium flex items-center gap-2 mb-4">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="text-primary">AI Assistant</span>
                </h3>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: 'Summarize this email', query: 'Summarize this email in 3 bullet points' },
                    { label: 'Extract action items', query: 'What action items or tasks are in this email?' },
                    { label: 'Draft a reply', query: 'Draft a professional reply to this email' },
                    { label: 'Key details', query: 'Extract key details: dates, names, amounts, deadlines' },
                  ].map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQueryInput(action.query);
                        handleQuery(new Event('submit') as unknown as React.FormEvent);
                      }}
                      disabled={isAILoading}
                      className="gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Custom Query */}
                <form onSubmit={handleQuery} className="flex gap-2 mb-4">
                  <Input
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="Ask anything about this email..."
                    disabled={isAILoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isAILoading || !queryInput.trim()} className="gap-1">
                    {isAILoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Ask
                  </Button>
                </form>

                {/* AI Response */}
                {aiResponse && (
                  <div className="p-4 bg-background rounded-lg border animate-fade-in">
                    <div className="prose prose-sm max-w-none">{aiResponse.answer}</div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <span>Confidence: {(aiResponse.confidence * 100).toFixed(0)}%</span>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(aiResponse.answer)} className="gap-1">
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>

                    {aiResponse.suggestedActions && aiResponse.suggestedActions.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                        <div className="flex flex-wrap gap-2">
                          {aiResponse.suggestedActions.map((action, i) => (
                            <Button key={i} variant="outline" size="sm" onClick={() => {
                              setQueryInput(`Follow up on: ${action.description}`);
                              handleQuery(new Event('submit') as unknown as React.FormEvent);
                            }}>
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Generate Response Section */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
              <div className="p-4">
                <h3 className="font-medium flex items-center gap-2 mb-4 text-green-800 dark:text-green-200">
                  <Bot className="h-5 w-5" />
                  Generate Response
                </h3>

                {!showGeneratedResponse ? (
                  <form onSubmit={handleGenerateResponse} className="space-y-3">
                    <div>
                      <Label className="text-sm">Instruction for the response</Label>
                      <Input
                        value={responseInstruction}
                        onChange={(e) => setResponseInstruction(e.target.value)}
                        placeholder="e.g., 'Politely decline the meeting and suggest next Tuesday' or 'Confirm attendance and ask for agenda'"
                        className="mt-1"
                      />
                    </div>
                    <Button type="submit" disabled={isGenerating || !responseInstruction.trim()} className="gap-1 bg-green-600 hover:bg-green-700">
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Generate Response
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-4 bg-background rounded-lg border">
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">{generatedResponse}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="default" onClick={() => navigator.clipboard.writeText(generatedResponse)} className="gap-1">
                        <Copy className="h-4 w-4" />
                        Copy Response
                      </Button>
                      <Button variant="outline" onClick={() => setShowGeneratedResponse(false)} className="gap-1">
                        <ChevronUp className="h-4 w-4" />
                        Generate Another
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}