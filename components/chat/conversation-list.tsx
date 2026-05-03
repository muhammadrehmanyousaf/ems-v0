"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useChat } from "@/context/ChatContext";
import { useUser } from "@/context/UserContext";
import { ChatAPI, type ChatUser } from "@/lib/api/chat";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MessageSquarePlus,
  Users,
  ArrowLeft,
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

function formatConversationTime(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ConversationList() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    isLoadingConversations,
    onlineStatuses,
    typingUsers,
    createConversation,
  } = useChat();
  const { user } = useUser();

  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.otherUser.fullName.toLowerCase().includes(q) ||
        c.lastMessageText?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Load contacts for new chat
  const handleNewChat = async () => {
    setShowNewChat(true);
    setLoadingContacts(true);
    try {
      const data = await ChatAPI.getContacts();
      setContacts(data);
    } catch {
      // contacts load failed
    } finally {
      setLoadingContacts(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase();
    return contacts.filter((c) => c.fullName.toLowerCase().includes(q));
  }, [contacts, contactSearch]);

  const handleSelectContact = async (contact: ChatUser) => {
    const convo = await createConversation(contact.id);
    if (convo) {
      setActiveConversation(convo.id);
    }
    setShowNewChat(false);
    setContactSearch("");
  };

  // New chat contact picker view
  if (showNewChat) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-950">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => {
                setShowNewChat(false);
                setContactSearch("");
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <h2 className="text-lg font-semibold">New Conversation</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="pl-9 h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            />
          </div>
        </div>

        {/* Contacts */}
        <ScrollArea className="flex-1">
          {loadingContacts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-bridal-gold" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {contactSearch ? "No contacts match your search" : "No contacts available"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelectContact(contact)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bridal-cream dark:hover:bg-bridal-charcoal/40 transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.profileImage || undefined} alt={contact.fullName} />
                      <AvatarFallback className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white text-xs font-semibold">
                        {getInitials(contact.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-950" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contact.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.contactType === "vendor" ? "Vendor" : "Customer"}
                      {contact.vendorType ? ` · ${contact.vendorType}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Main conversation list view
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Messages</h2>
          <button
            type="button"
            onClick={handleNewChat}
            className="p-2 rounded-lg hover:bg-bridal-cream dark:hover:bg-bridal-charcoal/40 text-bridal-gold-dark transition-colors"
            title="New conversation"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {isLoadingConversations && conversations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-bridal-gold" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-bridal-cream dark:bg-bridal-charcoal/40 flex items-center justify-center mb-3">
              <MessageCircle className="h-7 w-7 text-bridal-gold/70" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? "Try a different search" : "Start a new chat to get going"}
            </p>
            {!search && (
              <button
                type="button"
                onClick={handleNewChat}
                className="mt-4 text-xs font-medium text-bridal-gold-dark hover:text-bridal-gold-dark transition-colors"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          <div className="py-1">
            {filteredConversations.map((convo) => {
              const isActive = convo.id === activeConversationId;
              const isOnline = onlineStatuses[convo.otherUser.id] ?? convo.otherUser.isOnline;
              const isTyping = typingUsers[convo.id];
              const isOwnMessage = convo.lastMessageSenderId === Number(user?.id);

              return (
                <button
                  key={convo.id}
                  type="button"
                  onClick={() => setActiveConversation(convo.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 text-left group",
                    isActive
                      ? "bg-bridal-cream dark:bg-bridal-charcoal/40 border-r-2 border-bridal-gold-dark"
                      : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                  )}
                >
                  {/* Avatar with online indicator */}
                  <div className="relative shrink-0">
                    <Avatar className="h-11 w-11">
                      <AvatarImage
                        src={convo.otherUser.profileImage || undefined}
                        alt={convo.otherUser.fullName}
                      />
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold text-white",
                          isActive
                            ? "bg-gradient-to-br from-bridal-gold to-bridal-gold-dark"
                            : "bg-gradient-to-br from-gray-400 to-gray-600"
                        )}
                      >
                        {getInitials(convo.otherUser.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-950" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm truncate",
                          convo.unreadCount > 0 ? "font-semibold" : "font-medium"
                        )}
                      >
                        {convo.otherUser.fullName}
                      </p>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatConversationTime(convo.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={cn(
                          "text-xs truncate",
                          isTyping
                            ? "text-bridal-gold italic font-medium"
                            : convo.unreadCount > 0
                            ? "text-gray-700 dark:text-gray-300 font-medium"
                            : "text-gray-500"
                        )}
                      >
                        {isTyping
                          ? `${isTyping} is typing...`
                          : convo.lastMessageText
                          ? `${isOwnMessage ? "You: " : ""}${convo.lastMessageText}`
                          : "No messages yet"}
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-bridal-gold text-white text-[10px] font-bold">
                          {convo.unreadCount > 99 ? "99+" : convo.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
