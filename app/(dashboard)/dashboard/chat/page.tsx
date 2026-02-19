"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatMessageArea } from "@/components/chat/chat-message-area";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatHeader } from "@/components/chat/chat-header";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { activeConversationId, setActiveConversation } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);

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

  const handleBack = () => {
    setActiveConversation(null);
    setShowSidebar(true);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-gray-950 rounded-t-xl border border-gray-200 dark:border-gray-800 m-2 mt-0 shadow-sm">
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          "w-full lg:w-[340px] xl:w-[380px] shrink-0 border-r border-gray-200 dark:border-gray-800",
          showSidebar ? "block" : "hidden lg:block"
        )}
      >
        <ConversationList />
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !showSidebar ? "flex" : "hidden lg:flex"
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
