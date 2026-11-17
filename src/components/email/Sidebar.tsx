"use client"

import { useState } from 'react';
import {
  Inbox, Star, Archive, Send, Trash2, Settings,
  Bot, Users, Mail, Filter, Bell, Plus, ChevronDown, ChevronUp,
  RefreshCw, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ActiveView = 'inbox' | 'starred' | 'assistant-reply' | 'client-reply' | 'no-reply' | 'unclassified' | 'sent' | 'trash';

interface SidebarProps {
  stats: {
    total: number;
    unread: number;
    assistantReply: number;
    clientReply: number;
    noReply: number;
    unclassified: number;
  };
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  accounts: Array<{ id: string; email: string; name: string; isActive: boolean }>;
  onSync: () => void;
  isSyncing: boolean;
  onAddAccount: () => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: 'total' | 'unread' | 'assistantReply' | 'clientReply' | 'noReply' | 'unclassified' | null;
  key: 'total' | 'unread' | 'assistantReply' | 'clientReply' | 'noReply' | 'unclassified' | null;
  variant?: 'assistant' | 'client' | 'noreply' | 'default';
}

const navigationItems: NavItem[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, count: 'total', key: 'total' },
  { id: 'starred', label: 'Starred', icon: Star, count: null, key: null },
  { id: 'assistant-reply', label: 'Assistant Reply', icon: Bot, count: 'assistantReply', key: 'assistantReply', variant: 'assistant' },
  { id: 'client-reply', label: 'Client Reply', icon: Users, count: 'clientReply', key: 'clientReply', variant: 'client' },
  { id: 'no-reply', label: 'No Reply', icon: Archive, count: 'noReply', key: 'noReply', variant: 'noreply' },
  { id: 'unclassified', label: 'Unclassified', icon: Filter, count: 'unclassified', key: 'unclassified', variant: 'default' },
  { id: 'sent', label: 'Sent', icon: Send, count: null, key: null },
  { id: 'trash', label: 'Trash', icon: Trash2, count: null, key: null },
];

export function Sidebar({
  stats,
  activeView,
  setActiveView,
  accounts,
  onSync,
  isSyncing,
  onAddAccount
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    navigation: true,
    accounts: true,
    categories: true,
  });

  const toggleSection = (section: 'navigation' | 'accounts' | 'categories') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getCount = (key: 'total' | 'unread' | 'assistantReply' | 'clientReply' | 'noReply' | 'unclassified' | null) => {
    if (!key) return null;
    return stats[key] || 0;
  };

  return (
    <aside className="w-72 flex-shrink-0 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onAddAccount} title="Add Account">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Navigation */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-2 py-1 text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('navigation')}
            >
              <span className="font-medium uppercase tracking-wider text-xs">Navigation</span>
              {expandedSections.navigation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expandedSections.navigation && (
              <div className="space-y-1 mt-1 ml-2">
                {navigationItems.map((item) => {
                  const count = getCount(item.count);
                  const isActive = activeView === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'w-full justify-between px-2 py-1.5 text-sm',
                        isActive && 'shadow-sm'
                      )}
                      onClick={() => setActiveView(item.id)}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate flex-1">{item.label}</span>
                      </div>
                      {count !== null && (
                        <Badge variant={item.variant || 'secondary'} className="text-xs px-2 py-0.5">
                          {count}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email Accounts */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-2 py-1 text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('accounts')}
            >
              <span className="font-medium uppercase tracking-wider text-xs flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Accounts
              </span>
              {expandedSections.accounts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expandedSections.accounts && (
              <div className="space-y-1 mt-1 ml-2">
                {accounts.map((account) => (
                  <Button
                    key={account.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between px-2 py-1.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs font-medium">
                          {account.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{account.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      account.isActive ? 'bg-green-500' : 'bg-gray-400'
                    )} />
                  </Button>
                ))}
                {accounts.length === 0 && (
                  <Button variant="outline" size="sm" className="w-full justify-center px-2 py-1.5 text-sm" onClick={onAddAccount}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Account
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-2 py-1 text-muted-foreground hover:text-foreground"
              onClick={() => toggleSection('categories')}
            >
              <span className="font-medium uppercase tracking-wider text-xs flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Quick Stats
              </span>
              {expandedSections.categories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expandedSections.categories && (
              <div className="space-y-2 mt-2 ml-2 grid grid-cols-2 gap-2">
                <StatCard label="Total" value={stats.total} icon={<Mail className="h-4 w-4" />} />
                <StatCard label="Unread" value={stats.unread} icon={<Mail className="h-4 w-4" />} variant="destructive" />
                <StatCard label="Assistant" value={stats.assistantReply} icon={<Bot className="h-4 w-4" />} variant="assistant" />
                <StatCard label="Client" value={stats.clientReply} icon={<Users className="h-4 w-4" />} variant="client" />
                <StatCard label="No Reply" value={stats.noReply} icon={<Archive className="h-4 w-4" />} variant="noreply" />
                <StatCard label="Pending" value={stats.unclassified} icon={<Filter className="h-4 w-4" />} variant="default" />
              </div>
            )}
          </div>

          {/* Sync Button */}
          <Button
            variant="outline"
            className="w-full justify-center gap-2 mt-4"
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isSyncing ? 'Syncing...' : 'Sync Emails'}
          </Button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </aside>
  );
}

type StatVariant = 'default' | 'destructive' | 'assistant' | 'client' | 'noreply';

function StatCard({ label, value, icon, variant = 'default' }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant?: StatVariant;
}) {
  const variantColors = {
    default: 'bg-muted',
    destructive: 'bg-red-50 dark:bg-red-950',
    assistant: 'bg-purple-50 dark:bg-purple-950',
    client: 'bg-orange-50 dark:bg-orange-950',
    noreply: 'bg-gray-50 dark:bg-gray-950',
  };

  const textColors = {
    default: 'text-foreground',
    destructive: 'text-red-600 dark:text-red-400',
    assistant: 'text-purple-600 dark:text-purple-400',
    client: 'text-orange-600 dark:text-orange-400',
    noreply: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className={cn('p-3 rounded-lg', variantColors[variant])}>
      <div className="flex items-center justify-between mb-1">
        <span className={cn('text-xs font-medium', textColors[variant])}>{label}</span>
        <span className={cn('text-muted-foreground', textColors[variant])}>{icon}</span>
      </div>
      <p className={cn('text-2xl font-bold', textColors[variant])}>{value}</p>
    </div>
  );
}