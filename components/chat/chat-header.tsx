"use client";

import React from "react";
import { useChat } from "@/context/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Info,
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

interface ChatHeaderProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatHeader({ onBack, showBackButton }: ChatHeaderProps) {
  const { activeConversationId, conversations, onlineStatuses, typingUsers } = useChat();

  const activeConvo = conversations.find((c) => c.id === activeConversationId);

  if (!activeConvo || !activeConversationId) return null;

  const isOnline = onlineStatuses[activeConvo.otherUser.id] ?? activeConvo.otherUser.isOnline;
  const isTyping = typingUsers[activeConversationId];

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-950">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={activeConvo.otherUser.profileImage || undefined}
              alt={activeConvo.otherUser.fullName}
            />
            <AvatarFallback className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white text-xs font-semibold">
              {getInitials(activeConvo.otherUser.fullName)}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-950" />
          )}
        </div>

        {/* Info */}
        <div>
          <h3 className="text-sm font-semibold">{activeConvo.otherUser.fullName}</h3>
          <p className="text-xs">
            {isTyping ? (
              <span className="text-bridal-gold font-medium">typing...</span>
            ) : isOnline ? (
              <span className="text-green-600">Online</span>
            ) : (
              <span className="text-gray-400">Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Voice/video calling and the overflow menu aren't implemented yet (no
          backend), so we don't render dead buttons that silently do nothing —
          that reads as "the app is broken." Re-add when the feature ships. */}
    </div>
  );
}
