import React from 'react';
import { Trash2 } from 'lucide-react';
import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation
}) => {
  // Default recent thread titles from reference if none yet saved
  const defaultRecentTitles = [
    'New Legal Consultation',
    'What is the mandatory leg...',
    'பக்கத்து வீட்டுக்காரருக்...',
    'punishment for murder',
    'how to file a restraining or...'
  ];

  const items = conversations.length > 0
    ? conversations
    : defaultRecentTitles.map((title, i) => ({
        id: `mock-thread-${i}`,
        title,
        timestamp: Date.now() - i * 3600000,
        messages: [],
        domain: 'general' as const
      }));

  return (
    <div className="pl-4 pr-1 py-1 space-y-1 my-1">
      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">
        RECENT THREADS
      </p>
      <div className="space-y-0.5">
        {items.map((conv, idx) => {
          const isActive = activeConversationId ? conv.id === activeConversationId : idx === 0;
          return (
            <div
              key={conv.id}
              className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors ${
                isActive
                  ? 'bg-[#F0EFFF] text-[#37318F] font-bold dark:bg-indigo-950/60 dark:text-indigo-200'
                  : 'text-[#4B5563] dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-[#17244F] dark:hover:text-white'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className="flex-1 text-left truncate cursor-pointer pr-1"
                title={conv.title}
              >
                {conv.title}
              </button>
              {onDeleteConversation && conversations.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                  title="Delete thread"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
