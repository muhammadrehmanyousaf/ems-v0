'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useChat } from '@/context/ChatContext';
import { ConversationList } from '@/components/chat/conversation-list';
import { ChatMessageArea } from '@/components/chat/chat-message-area';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatHeader } from '@/components/chat/chat-header';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function CustomerConversationsPage() {
  const { isAuthenticated, isLoading } = useUser();
  const { activeConversationId, setActiveConversation } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // On mobile: when a conversation is selected, hide the sidebar
  useEffect(() => {
    if (activeConversationId) {
      const handleResize = () => {
        if (window.innerWidth < 1024) {
          setShowSidebar(false);
        }
      };
      handleResize();
    }
  }, [activeConversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActiveConversation(null);
    };
  }, []);

  const handleBack = () => {
    setActiveConversation(null);
    setShowSidebar(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 mx-2 sm:mx-4 lg:mx-8 my-4 shadow-sm">
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          'w-full lg:w-[340px] xl:w-[380px] shrink-0 border-r border-gray-200 dark:border-gray-800',
          showSidebar ? 'block' : 'hidden lg:block'
        )}
      >
        <ConversationList />
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          !showSidebar ? 'flex' : 'hidden lg:flex'
        )}
      >
        {activeConversationId ? (
          <>
            <ChatHeader onBack={handleBack} showBackButton />
            <ChatMessageArea />
            <ChatInput />
          </>
        ) : (
          <ChatMessageArea />
        )}
      </div>
    </div>
  );
}
