"use client"

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Bell, Moon, Sun, Menu,
  Bot, Sparkles, RefreshCw, Plus, ChevronDown, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/email/Sidebar';
import { EmailCard } from '@/components/email/EmailCard';
import { EmailDetail } from '@/components/email/EmailDetail';
import { ClientViewModal } from '@/components/email/ClientView';
import { Email, EmailCategory, DashboardStats, EmailAccount, ClientView } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Mock data for demo
const mockEmails: Email[] = [
  {
    id: '1',
    messageId: 'msg-1',
    threadId: 'thread-1',
    from: '"John Smith" <john.smith@acme.com>',
    to: 'assistant@client.com',
    subject: 'Meeting Request: Q4 Strategy Review',
    body: `Hi there,

I'd like to schedule a meeting to review our Q4 strategy. Are you available next Tuesday or Wednesday between 2-4 PM? Please let me know what works best for you.

We'll need to cover:
- Revenue targets
- Marketing budget allocation
- New product launch timeline
- Team resource planning

Looking forward to your thoughts.

Best regards,
John Smith
VP of Operations, Acme Corp`,
    bodyHtml: `<p>Hi there,</p><p>I'd like to schedule a meeting to review our Q4 strategy...</p>`,
    snippet: 'I\'d like to schedule a meeting to review our Q4 strategy. Are you available next Tuesday or Wednesday...',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: true,
    labels: ['INBOX', 'IMPORTANT'],
    category: 'assistant-reply',
    attachments: [],
    headers: {},
  },
  {
    id: '2',
    messageId: 'msg-2',
    threadId: 'thread-2',
    from: '"Sarah Johnson" <sarah.j@legalfirm.com>',
    to: 'client@personal.com',
    subject: 'Urgent: Contract Review Required - Confidential',
    body: `Dear Client,

This is a confidential matter requiring your personal attention. We have received the revised contract from the counterparty with several material changes to the liability clauses and termination provisions.

Key changes:
1. Liability cap increased from $500K to $2M
2. Termination notice period reduced from 90 to 30 days
3. New indemnification clause added for IP infringement

Please review the attached document and provide your decision by Friday 5 PM. This requires your personal sign-off.

Regards,
Sarah Johnson
Senior Partner, Legal Firm LLC`,
    bodyHtml: `<p>Dear Client,</p><p>This is a confidential matter...</p>`,
    snippet: 'This is a confidential matter requiring your personal attention. We have received the revised contract...',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'IMPORTANT', 'CONFIDENTIAL'],
    category: 'client-reply',
    attachments: [
      { id: 'att-1', filename: 'Revised_Contract_v3.pdf', mimeType: 'application/pdf', size: 245760 },
    ],
    headers: {},
  },
  {
    id: '3',
    messageId: 'msg-3',
    threadId: 'thread-3',
    from: '"Amazon Business" <noreply@amazon.com>',
    to: 'client@personal.com',
    subject: 'Your Amazon Business Order #112-3456789 has shipped',
    body: `Your order has shipped!

Order Details:
- MacBook Pro 16" M3 Max - Qty: 1
- AppleCare+ for MacBook Pro - Qty: 1
- USB-C to USB Adapter - Qty: 2

Tracking: 1Z999AA10123456784
Estimated Delivery: Tomorrow by 8 PM

This is an automated notification. No action required.`,
    bodyHtml: `<p>Your order has shipped!</p>...`,
    snippet: 'Your order has shipped! Order Details: MacBook Pro 16" M3 Max - Qty: 1...',
    date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ['INBOX', 'PROMOTIONS'],
    category: 'no-reply',
    attachments: [],
    headers: {},
  },
  {
    id: '4',
    messageId: 'msg-4',
    threadId: 'thread-4',
    from: '"Emily Chen" <emily.chen@startup.io>',
    to: 'assistant@client.com',
    subject: 'Follow-up: Partnership Proposal',
    body: `Hi,

Following up on my email from last week about the partnership proposal. I wanted to check if you've had a chance to review the deck I sent over.

We're really excited about the potential to work together and believe there's strong synergy between our platforms. Happy to hop on a quick 15-min call to discuss any questions.

Let me know what you think!

Best,
Emily Chen
Head of Partnerships, Startup.io`,
    bodyHtml: `<p>Hi,</p><p>Following up on my email from last week...</p>`,
    snippet: 'Following up on my email from last week about the partnership proposal...',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ['INBOX'],
    category: 'unclassified',
    attachments: [],
    headers: {},
  },
  {
    id: '5',
    messageId: 'msg-5',
    threadId: 'thread-5',
    from: '"Microsoft 365" <noreply@microsoft.com>',
    to: 'client@personal.com',
    subject: 'Security Alert: New Sign-in Activity',
    body: `We detected a new sign-in to your Microsoft account.

Details:
- Location: San Francisco, CA (based on IP)
- Device: Chrome on Windows
- Time: Just now

If this was you, no action is needed. If not, please secure your account immediately.

This is an automated security notification.`,
    bodyHtml: `<p>We detected a new sign-in...</p>`,
    snippet: 'We detected a new sign-in to your Microsoft account. Details: Location: San Francisco, CA...',
    date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
    isStarred: false,
    labels: ['INBOX', 'SECURITY'],
    category: 'no-reply',
    attachments: [],
    headers: {},
  },
  {
    id: '6',
    messageId: 'msg-6',
    threadId: 'thread-6',
    from: '"David Park" <david.park@investor.com>',
    to: 'client@personal.com',
    subject: 'Board Meeting Materials - Please Review Before Friday',
    body: `Hi,

Attached are the materials for Friday's board meeting. Please review the following before the meeting:

1. Financial projections Q4 (pages 3-8)
2. Fundraising update (pages 9-12)
3. Key hires pipeline (pages 13-15)
4. Strategic initiatives for 2025 (pages 16-22)

Your feedback on the fundraising strategy (section 2) is particularly important as we need to finalize our approach before the meeting.

Thanks,
David Park
Managing Partner, Investor Capital`,
    bodyHtml: `<p>Hi,</p><p>Attached are the materials...</p>`,
    snippet: 'Attached are the materials for Friday\'s board meeting. Please review the following before the meeting...',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: true,
    labels: ['INBOX', 'IMPORTANT'],
    category: 'client-reply',
    attachments: [
      { id: 'att-2', filename: 'Board_Meeting_Dec2024.pdf', mimeType: 'application/pdf', size: 1048576 },
      { id: 'att-3', filename: 'Financial_Projections_Q4.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 524288 },
    ],
    headers: {},
  },
  {
    id: '7',
    messageId: 'msg-7',
    threadId: 'thread-7',
    from: '"Calendly" <notifications@calendly.com>',
    to: 'assistant@client.com',
    subject: 'New Meeting Scheduled: Discovery Call with TechCorp',
    body: `A new meeting has been scheduled!

Event: Discovery Call with TechCorp
Date: Tomorrow, 10:00 AM - 10:30 AM PST
Attendees: you@client.com, contact@techcorp.com
Location: Zoom (link in calendar invite)

This meeting was booked through your Calendly link.`,
    bodyHtml: `<p>A new meeting has been scheduled!</p>...`,
    snippet: 'A new meeting has been scheduled! Event: Discovery Call with TechCorp...',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ['INBOX', 'CALENDAR'],
    category: 'assistant-reply',
    attachments: [],
    headers: {},
  },
  {
    id: '8',
    messageId: 'msg-8',
    threadId: 'thread-8',
    from: '"LinkedIn" <noreply@linkedin.com>',
    to: 'client@personal.com',
    subject: 'You have 3 new connection requests',
    body: `You have 3 new connection requests:
- Alex Thompson, CTO at DataFlow
- Maria Rodriguez, VP Engineering at CloudScale
- James Wilson, Founder at AIStartup

View your invitations on LinkedIn.`,
    bodyHtml: `<p>You have 3 new connection requests...</p>`,
    snippet: 'You have 3 new connection requests: Alex Thompson, CTO at DataFlow...',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isStarred: false,
    labels: ['INBOX', 'SOCIAL'],
    category: 'no-reply',
    attachments: [],
    headers: {},
  },
];

const mockAccounts: EmailAccount[] = [
  { id: 'acc-1', email: 'client@personal.com', name: 'Primary Client', accessToken: '', provider: 'gmail', isActive: true, lastSynced: new Date().toISOString() },
  { id: 'acc-2', email: 'assistant@client.com', name: 'Assistant Inbox', accessToken: '', provider: 'gmail', isActive: true, lastSynced: new Date().toISOString() },
];

export default function Dashboard() {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeView, setActiveView] = useState<'inbox' | 'starred' | 'assistant-reply' | 'client-reply' | 'no-reply' | 'unclassified' | 'sent' | 'trash'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiQueryResponse, setAiQueryResponse] = useState<{ answer: string; confidence: number; sources: string[]; suggestedActions?: Array<{type: string; label: string; description: string}> } | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [clientView, setClientView] = useState<ClientView | null>(null);
  const [generatedResponse, setGeneratedResponse] = useState<string>('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  // Filter emails based on active view and search
  const filteredEmails = emails.filter(email => {
    // View filter
    if (activeView !== 'inbox' && activeView !== 'starred' && activeView !== 'sent' && activeView !== 'trash') {
      if (email.category !== activeView) return false;
    }
    if (activeView === 'starred' && !email.isStarred) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchable = `${email.from} ${email.subject} ${email.snippet} ${email.body}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: emails.length,
    unread: emails.filter(e => !e.isRead).length,
    assistantReply: emails.filter(e => e.category === 'assistant-reply').length,
    clientReply: emails.filter(e => e.category === 'client-reply').length,
    noReply: emails.filter(e => e.category === 'no-reply').length,
    unclassified: emails.filter(e => e.category === 'unclassified').length,
  };

  const handleClassify = useCallback(async (emailId: string, category: EmailCategory) => {
    setEmails(prev => prev.map(e =>
      e.id === emailId ? { ...e, category } : e
    ));

    // If client-reply, open client view
    if (category === 'client-reply') {
      const email = emails.find(e => e.id === emailId);
      if (email) {
        setClientView({
          emailId: email.id,
          clientEmail: email.from,
          subject: email.subject,
          body: email.body,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [emails]);

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    // Mark as read
    if (!email.isRead) {
      setEmails(prev => prev.map(e =>
        e.id === email.id ? { ...e, isRead: true } : e
      ));
    }
  };

  const handleAIQuery = async (query: string): Promise<{ answer: string; confidence: number; sources: string[]; suggestedActions?: Array<{type: 'reply' | 'forward' | 'archive' | 'label' | 'schedule' | 'delegate'; label: string; description: string}> }> => {
    setIsAILoading(true);
    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses: Record<string, { answer: string; confidence: number; sources: string[]; suggestedActions?: Array<{type: 'reply' | 'forward' | 'archive' | 'label' | 'schedule' | 'delegate'; label: string; description: string}> }> = {
      'summarize': {
        answer: `**Summary of "${selectedEmail?.subject}"**\n\n• **Key Topic**: ${selectedEmail?.subject.includes('Meeting') ? 'Meeting scheduling' : selectedEmail?.subject.includes('Contract') ? 'Contract review' : 'Business communication'}\n• **Sender**: ${selectedEmail?.from.split('<')[0]?.trim() || selectedEmail?.from}\n• **Urgency**: ${selectedEmail?.category === 'client-reply' ? 'High - Requires client attention' : selectedEmail?.category === 'assistant-reply' ? 'Medium - Assistant can handle' : 'Low - Informational only'}\n• **Action Required**: ${selectedEmail?.category === 'client-reply' ? 'Client must review and respond personally' : selectedEmail?.category === 'assistant-reply' ? 'Assistant can reply on behalf' : 'No response needed'}`,
        confidence: 0.92,
        sources: [selectedEmail?.id || ''],
        suggestedActions: [
          { type: 'reply', label: 'Draft Reply', description: 'Generate a professional response' },
          { type: 'schedule', label: 'Schedule Meeting', description: 'Book time on calendar' },
        ]
      },
      'action items': {
        answer: `**Action Items Extracted**\n\n1. **Review contract changes** - Liability cap, termination clauses, indemnification (Deadline: Friday 5 PM)\n2. **Provide personal decision** - Requires client sign-off on revised terms\n3. **Schedule follow-up call** - If needed to discuss concerns\n\n**Priority**: HIGH - Legal/financial implications`,
        confidence: 0.88,
        sources: [selectedEmail?.id || ''],
        suggestedActions: [
          { type: 'delegate', label: 'Flag for Client', description: 'Mark as requiring personal attention' },
          { type: 'schedule', label: 'Set Reminder', description: 'Remind before Friday deadline' },
        ]
      },
      'draft': {
        answer: `**Draft Response**\n\nDear ${selectedEmail?.from.split('<')[0]?.trim().split(' ')[0] || 'Sender'},\n\nThank you for your email regarding ${selectedEmail?.subject.toLowerCase()}. I've reviewed the details and ${selectedEmail?.category === 'client-reply' ? 'will need to consult with the client before providing a formal response' : 'can confirm this on behalf of the client'}.\n\n${selectedEmail?.category === 'assistant-reply' ? 'We are available for the proposed time and will send a calendar invite shortly.' : 'We will provide a comprehensive response by the requested deadline.'}\n\nBest regards,\n[Assistant Name]\nExecutive Assistant`,
        confidence: 0.85,
        sources: [selectedEmail?.id || ''],
        suggestedActions: [
          { type: 'reply', label: 'Send This Reply', description: 'Use this draft as the response' },
          { type: 'forward', label: 'Forward to Client', description: 'Share with client for review' },
        ]
      },
    };

    const lowerQuery = query.toLowerCase();
    let result = responses['summarize'];

    if (lowerQuery.includes('action') || lowerQuery.includes('task')) {
      result = responses['action items'];
    } else if (lowerQuery.includes('draft') || lowerQuery.includes('reply') || lowerQuery.includes('respond')) {
      result = responses['draft'];
    }

    setIsAILoading(false);
    return result;
  };

  const handleGenerateResponse = async (instruction: string): Promise<string> => {
    setIsGeneratingResponse(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const responses: Record<string, string> = {
      'decline': `Dear ${selectedEmail?.from.split('<')[0]?.trim().split(' ')[0] || 'Sender'},\n\nThank you for the invitation. After reviewing the details, I regret to inform you that we must decline this opportunity at this time due to prior commitments and strategic priorities.\n\nWe appreciate you thinking of us and would be happy to revisit this in the future should circumstances change.\n\nBest regards,\n[Assistant Name]\nExecutive Assistant`,
      'confirm': `Dear ${selectedEmail?.from.split('<')[0]?.trim().split(' ')[0] || 'Sender'},\n\nThank you for reaching out. We are pleased to confirm our attendance/participation as requested.\n\nPlease find the calendar invite attached. We look forward to a productive discussion.\n\nBest regards,\n[Assistant Name]\nExecutive Assistant`,
      'default': `Dear ${selectedEmail?.from.split('<')[0]?.trim().split(' ')[0] || 'Sender'},\n\nThank you for your email. ${instruction}\n\nWe will follow up with any additional details as needed.\n\nBest regards,\n[Assistant Name]\nExecutive Assistant`,
    };

    const lowerInstruction = instruction.toLowerCase();
    let response = responses['default'];

    if (lowerInstruction.includes('decline') || lowerInstruction.includes('reject') || lowerInstruction.includes('politely')) {
      response = responses['decline'];
    } else if (lowerInstruction.includes('confirm') || lowerInstruction.includes('accept') || lowerInstruction.includes('attend')) {
      response = responses['confirm'];
    }

    setIsGeneratingResponse(false);
    return response;
  };

  const handleClientSend = async (response: string) => {
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (clientView) {
      setClientView({ ...clientView, status: 'sent', updatedAt: new Date().toISOString() });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    // In real app, this would sync from Gmail API
  };

  const handleAddAccount = () => {
    // In real app, this would open OAuth flow
    alert('In production, this would open Google OAuth flow to connect a Gmail account.');
  };

  // Toggle dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        stats={stats}
        activeView={activeView}
        setActiveView={setActiveView}
        accounts={mockAccounts}
        onSync={handleSync}
        isSyncing={isSyncing}
        onAddAccount={handleAddAccount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold hidden sm:block">
              {activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')}
            </h1>
          </div>

          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} title="Toggle theme">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" title="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="outline" size="sm" className="gap-1 hidden sm:flex" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync
            </Button>
          </div>
        </header>

        {/* Email List + Detail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className={`${sidebarOpen ? 'w-96' : 'w-0'} lg:w-96 flex-shrink-0 border-r bg-card flex flex-col overflow-hidden`}>
            <div className="p-3 border-b flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1">
                <Badge variant="assistant" className="text-xs">{stats.assistantReply}</Badge>
                <Badge variant="client" className="text-xs">{stats.clientReply}</Badge>
                <Badge variant="noreply" className="text-xs">{stats.noReply}</Badge>
                <Badge variant="secondary" className="text-xs">{stats.unclassified}</Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                  <Mail className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg">No emails found</p>
                  <p className="text-sm">Try adjusting your filters or search</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredEmails.map((email) => (
                    <EmailCard
                      key={email.id}
                      email={email}
                      isSelected={selectedEmail?.id === email.id}
                      onSelect={() => handleEmailSelect(email)}
                      onStar={(e) => {
                        e.stopPropagation();
                        setEmails(prev => prev.map(em =>
                          em.id === email.id ? { ...em, isStarred: !em.isStarred } : em
                        ));
                      }}
                      onClassify={(e, category) => {
                        e.stopPropagation();
                        handleClassify(email.id, category);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email Detail */}
          <div className="flex-1 flex flex-col min-w-0">
            <EmailDetail
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onClassify={handleClassify}
              onQuery={handleAIQuery}
              onGenerateResponse={handleGenerateResponse}
            />
          </div>
        </div>
      </div>

      {/* Client View Modal */}
      <ClientViewModal
        clientView={clientView}
        onClose={() => setClientView(null)}
        onSend={handleClientSend}
      />
    </div>
  );
}