'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useChat } from '@/context/ChatContext';
import { ChatMessageArea } from '@/components/chat/chat-message-area';
import { ChatInput } from '@/components/chat/chat-input';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorUserId: number;
  vendorName: string;
  vendorImage?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ChatDrawer({
  open,
  onOpenChange,
  vendorUserId,
  vendorName,
  vendorImage,
}: ChatDrawerProps) {
  const {
    createConversation,
    setActiveConversation,
    activeConversationId,
    onlineStatuses,
  } = useChat();

  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initConversation = useCallback(async () => {
    setInitializing(true);
    setError(null);
    try {
      const convo = await createConversation(vendorUserId);
      if (convo) {
        await setActiveConversation(convo.id);
      } else {
        setError('Could not start conversation. Please try again.');
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setInitializing(false);
    }
  }, [vendorUserId, createConversation, setActiveConversation]);

  useEffect(() => {
    if (open) {
      initConversation();
    }
    return () => {
      if (!open) {
        setActiveConversation(null);
      }
    };
  }, [open]);

  const handleClose = () => {
    setActiveConversation(null);
    onOpenChange(false);
  };

  const isOnline = onlineStatuses[vendorUserId] ?? false;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[440px] p-0 flex flex-col gap-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Chat with {vendorName}</SheetTitle>

        {/* Custom Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white dark:bg-gray-950 shrink-0">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={vendorImage ? getImageUrl(vendorImage) : undefined}
                alt={vendorName}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white text-xs font-semibold">
                {getInitials(vendorName)}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-950" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">{vendorName}</h3>
            <p className="text-xs">
              {isOnline ? (
                <span className="text-green-600">Online</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close chat"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Chat Body */}
        {initializing ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <p className="text-sm text-gray-500">Starting conversation...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={initConversation}
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              Try again
            </button>
          </div>
        ) : activeConversationId ? (
          <>
            <ChatMessageArea />
            <ChatInput />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
