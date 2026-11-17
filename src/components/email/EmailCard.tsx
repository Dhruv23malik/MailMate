"use client"

import { formatDistanceToNow } from 'date-fns';
import { Mail, Star, MoreVertical, Bot, User, Archive, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Email, EmailCategory } from '@/types';

interface EmailCardProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  onStar: (e: React.MouseEvent) => void;
  onClassify: (e: React.MouseEvent, category: EmailCategory) => void;
}

const categoryConfig: Record<EmailCategory, { label: string; variant: 'assistant' | 'client' | 'noreply' | 'default'; icon: React.ReactNode }> = {
  'assistant-reply': { label: 'Assistant Reply', variant: 'assistant', icon: <Bot className="h-3 w-3" /> },
  'client-reply': { label: 'Client Reply', variant: 'client', icon: <User className="h-3 w-3" /> },
  'no-reply': { label: 'No Reply', variant: 'noreply', icon: <Archive className="h-3 w-3" /> },
  'unclassified': { label: 'Unclassified', variant: 'default', icon: <AlertTriangle className="h-3 w-3" /> },
};

export function EmailCard({ email, isSelected, onSelect, onStar, onClassify }: EmailCardProps) {
  const config = categoryConfig[email.category];
  const timeAgo = formatDistanceToNow(new Date(email.date), { addSuffix: true });

  // Extract sender name from email
  const senderName = email.from.includes('<')
    ? email.from.split('<')[0].trim().replace(/"/g, '')
    : email.from.split('@')[0];

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
          : 'hover:border-primary/30 hover:shadow-sm hover:bg-accent/30'
      } ${!email.isRead ? 'bg-background' : 'bg-muted/30'}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Star */}
        <Button
          variant="ghost"
          size="icon"
          className={`p-1 transition-colors ${email.isStarred ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/50 hover:text-yellow-500'}`}
          onClick={onStar}
          aria-label={email.isStarred ? 'Unstar' : 'Star'}
        >
          <Star className={cn(email.isStarred ? 'fill-current' : '')} />
        </Button>

        {/* Email Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{senderName}</span>
                <span className="text-muted-foreground text-xs hidden sm:block">•</span>
                <span className="text-sm text-muted-foreground truncate">{email.subject}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span className="truncate">{email.snippet}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge variant={config.variant} className="gap-1 text-xs">
                {config.icon}
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap hidden lg:block">
                {timeAgo}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onClassify(e, 'assistant-reply'); }}
              aria-label="Mark as Assistant Reply"
            >
              <Bot className="h-3 w-3" />
              <span className="hidden sm:inline">Assistant</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onClassify(e, 'client-reply'); }}
              aria-label="Mark as Client Reply"
            >
              <User className="h-3 w-3" />
              <span className="hidden sm:inline">Client</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onClassify(e, 'no-reply'); }}
              aria-label="Mark as No Reply"
            >
              <Archive className="h-3 w-3" />
              <span className="hidden sm:inline">No Reply</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
      )}
    </Card>
  );
}