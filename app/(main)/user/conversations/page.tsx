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

import { PageContainer, PageHeader, SectionCard } from '@/components/user-dashboard';

export default function CustomerConversationsPage() {
  const { isAuthenticated, isLoading } = useUser();
  const { activeConversationId, setActiveConversation } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (activeConversationId) {
      const handleResize = () => {
        if (window.innerWidth < 1024) setShowSidebar(false);
      };
      handleResize();
    }
  }, [activeConversationId]);

  useEffect(() => {
    return () => {
      setActiveConversation(null);
    };
  }, []);

  const handleBack = () => {
    setActiveConversation(null);
    setShowSidebar(true);
  };

  const eyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Messages</span>
    </>
  );

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="Messages"
          description="Talk to your booked vendors directly."
        />
        <SectionCard flush className="h-[60vh]">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-5 animate-spin text-bridal-gold" />
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="Messages"
        description="Talk to your booked vendors directly."
      />

      <SectionCard flush className="overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[480px]">
          <div
            className={cn(
              'w-full lg:w-[320px] xl:w-[360px] shrink-0 border-r border-border/60',
              showSidebar ? 'block' : 'hidden lg:block',
            )}
          >
            <ConversationList />
          </div>

          <div
            className={cn(
              'flex-1 flex flex-col min-w-0',
              !showSidebar ? 'flex' : 'hidden lg:flex',
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
      </SectionCard>
    </PageContainer>
  );
}
