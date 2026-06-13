"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@/context/ChatContext";
import { Send, Paperclip, Smile, Image } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const { activeConversationId, sendMessage, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
    }
  }, [message]);

  // Focus textarea when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      textareaRef.current?.focus();
    }
  }, [activeConversationId]);

  const handleSend = useCallback(() => {
    if (!message.trim() || !activeConversationId) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sendMessage(message.trim(), tempId);
    setMessage("");
    stopTyping();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [message, activeConversationId, sendMessage, stopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  if (!activeConversationId) return null;

  return (
    <div className="border-t bg-white dark:bg-gray-950 px-4 py-3">
      <div
        className={cn(
          "flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all duration-200",
          isFocused
            ? "border-bridal-gold/55 shadow-[0_0_0_3px_rgba(147,51,234,0.08)]"
            : "border-gray-200 dark:border-gray-800"
        )}
      >
        {/* Issue #21 — Attach + Image buttons were rendered with no
            onClick handler and no backend support for message attachments.
            Vendors clicked them, nothing happened, they reported the
            module as broken. Hidden until the upload endpoint ships;
            the icons stay imported so the wire-up is one-edit when
            the BE catches up. */}
        {/*
        <div className="flex items-center gap-0.5 pb-0.5">
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Send image"
          >
            <Image className="h-4.5 w-4.5" />
          </button>
        </div>
        */}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm leading-relaxed placeholder:text-gray-400 focus:outline-none min-h-[24px] max-h-[150px] py-0.5"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim()}
          className={cn(
            "p-2 rounded-xl transition-all duration-200 shrink-0",
            message.trim()
              ? "bg-gradient-to-r from-bridal-gold to-bridal-gold-dark text-white shadow-sm hover:shadow-md hover:from-bridal-gold-dark hover:to-bridal-gold-dark active:scale-95"
              : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Helper text */}
      <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
        Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[9px] font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[9px] font-mono">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
