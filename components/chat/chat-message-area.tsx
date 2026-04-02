"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useUser } from "@/context/UserContext";
import type { ChatMessageItem } from "@/lib/api/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Check,
  CheckCheck,
  Clock,
  ArrowDown,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateHeader(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isSameDay(d1: string, d2: string) {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Group messages by date
function groupMessagesByDate(messages: ChatMessageItem[]) {
  const groups: { date: string; messages: ChatMessageItem[] }[] = [];

  messages.forEach((msg) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && isSameDay(lastGroup.date, msg.createdAt)) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: msg.createdAt, messages: [msg] });
    }
  });

  return groups;
}

function MessageStatus({ message, isOwn }: { message: ChatMessageItem; isOwn: boolean }) {
  if (!isOwn) return null;

  const isOptimistic = (message as any)._optimistic;

  if (isOptimistic) {
    return <Clock className="h-3 w-3 text-gray-400" />;
  }
  if (message.isRead) {
    return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
  }
  return <Check className="h-3.5 w-3.5 text-gray-400" />;
}

interface MessageBubbleProps {
  message: ChatMessageItem;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  isLastInGroup: boolean;
}

function MessageBubble({ message, isOwn, showAvatar, showName, isLastInGroup }: MessageBubbleProps) {
  if (message.isDeleted) {
    return (
      <div className={cn("flex items-center gap-2 px-4 py-1", isOwn ? "justify-end" : "justify-start")}>
        <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 italic text-xs text-gray-400">
          This message was deleted
        </div>
      </div>
    );
  }

  if (message.messageType === "system") {
    return (
      <div className="flex justify-center px-4 py-2">
        <span className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 px-4",
        isOwn ? "justify-end" : "justify-start",
        isLastInGroup ? "mb-3" : "mb-0.5"
      )}
    >
      {/* Avatar space */}
      {!isOwn && (
        <div className="w-8 shrink-0 self-end">
          {showAvatar && (
            <Avatar className="h-7 w-7">
              <AvatarImage
                src={message.sender.profileImage || undefined}
                alt={message.sender.fullName}
              />
              <AvatarFallback className="bg-gradient-to-br from-gray-400 to-gray-600 text-white text-[10px] font-semibold">
                {getInitials(message.sender.fullName)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={cn("max-w-[70%] min-w-[80px]", isOwn ? "items-end" : "items-start")}>
        {showName && !isOwn && (
          <p className="text-[10px] font-medium text-gray-500 mb-0.5 ml-1">
            {message.sender.fullName}
          </p>
        )}
        <div
          className={cn(
            "relative px-3.5 py-2 text-sm leading-relaxed",
            isOwn
              ? cn(
                  "bg-gradient-to-br from-purple-600 to-purple-700 text-white",
                  showAvatar || isLastInGroup
                    ? "rounded-2xl rounded-br-md"
                    : "rounded-2xl"
                )
              : cn(
                  "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                  showAvatar || isLastInGroup
                    ? "rounded-2xl rounded-bl-md"
                    : "rounded-2xl"
                )
          )}
        >
          {message.content}
          <div
            className={cn(
              "flex items-center gap-1 mt-0.5",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <span
              className={cn(
                "text-[10px]",
                isOwn ? "text-purple-200" : "text-gray-400"
              )}
            >
              {formatMessageTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className={cn("text-[10px]", isOwn ? "text-purple-200" : "text-gray-400")}>
                · edited
              </span>
            )}
            <MessageStatus message={message} isOwn={isOwn} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatMessageArea() {
  const { messages, isLoadingMessages, hasMoreMessages, loadMoreMessages, activeConversationId, typingUsers, conversations } = useChat();
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > prevMessageCountRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: messages.length - prevMessageCountRef.current > 5 ? "auto" : "smooth" });
      });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, autoScroll]);

  // Scroll to bottom on conversation change
  useEffect(() => {
    if (activeConversationId) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
      setAutoScroll(true);
    }
  }, [activeConversationId]);

  // Detect scroll position
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 150;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setAutoScroll(isNearBottom);
    setShowScrollDown(!isNearBottom);

    // Load more messages when scrolled to top
    if (el.scrollTop < 80 && hasMoreMessages && !isLoadingMessages) {
      const prevScrollHeight = el.scrollHeight;
      loadMoreMessages().then(() => {
        requestAnimationFrame(() => {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight;
        });
      });
    }
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
  };

  const activeConvo = conversations.find((c) => c.id === activeConversationId);
  const typingUser = activeConversationId ? typingUsers[activeConversationId] : null;

  // No active conversation
  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center mb-4">
          <MessageCircle className="h-10 w-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Your Messages
        </h3>
        <p className="text-sm text-gray-500 mt-1.5 max-w-xs text-center">
          Select a conversation to start chatting or create a new one
        </p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {/* Loading indicator for older messages */}
        {isLoadingMessages && messages.length > 0 && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          </div>
        )}

        {/* Empty state */}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="h-16 w-16 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-3">
              <MessageCircle className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              No messages yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Send the first message to start the conversation
            </p>
          </div>
        )}

        {/* Loading full chat */}
        {isLoadingMessages && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        )}

        {/* Message groups by date */}
        <div className="py-4">
          {messageGroups.map((group, groupIdx) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center py-3 px-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <span className="px-3 text-[11px] font-medium text-gray-400 bg-white dark:bg-gray-950 whitespace-nowrap">
                  {formatDateHeader(group.date)}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              </div>

              {/* Messages */}
              {group.messages.map((msg, msgIdx) => {
                const isOwn = msg.senderId === Number(user?.id);
                const nextMsg = group.messages[msgIdx + 1];
                const prevMsg = group.messages[msgIdx - 1];

                // Show avatar if it's the last message from this sender in a consecutive group
                const isLastFromSender = !nextMsg || nextMsg.senderId !== msg.senderId;
                // Show name if it's the first message from this sender in a consecutive group
                const isFirstFromSender = !prevMsg || prevMsg.senderId !== msg.senderId;

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={isLastFromSender}
                    showName={isFirstFromSender}
                    isLastInGroup={isLastFromSender}
                  />
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {typingUser && (
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="w-8" />
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
              <span className="text-[11px] text-gray-400">{typingUser} is typing</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollDown && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 h-9 w-9 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10"
        >
          <ArrowDown className="h-4 w-4 text-gray-600" />
        </button>
      )}
    </div>
  );
}
