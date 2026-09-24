"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@/context/ChatContext";
import { Send, Paperclip, Smile, Image, Loader2 } from "lucide-react";
import { uploadChatAttachment } from "@/lib/api/chat";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const { activeConversationId, sendMessage, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  /* WW-MEDIA — one picker, two buttons: the image button filters to images,
     the clip button to video. Both end at the same upload. */
  const fileRef = useRef<HTMLInputElement>(null);
  const [accept, setAccept] = useState("image/*,video/*");
  const [uploading, setUploading] = useState(false);

  const pick = (mode: "image" | "video" | "any") => {
    setAccept(mode === "image" ? "image/*" : mode === "video" ? "video/*" : "image/*,video/*");
    // Let the accept attribute land before the dialog opens.
    requestAnimationFrame(() => fileRef.current?.click());
  };

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // so picking the same file twice still fires
      if (!file || !activeConversationId) return;
      setUploading(true);
      try {
        const up = await uploadChatAttachment(file);
        sendMessage(message.trim(), undefined, {
          attachmentUrl: up.attachmentUrl,
          attachmentName: up.attachmentName,
          // The server decides image vs video from the real mimetype.
          messageType: (up.messageType as "image" | "video" | "file") ?? "file",
        });
        setMessage("");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? "Could not send that file.";
        toast({ title: "Upload failed", description: msg, variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [activeConversationId, message, sendMessage],
  );

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
        {/* WW-MEDIA — these were rendered-but-hidden since Issue #21, waiting on
            an upload endpoint (POST /chat/attachments). It now exists, so they
            do what they always looked like they did. */}
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onFile}
        />
        <div className="flex items-center gap-0.5 pb-0.5">
          <button
            type="button"
            disabled={uploading}
            onClick={() => pick("any")}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Attach a photo or video"
          >
            {uploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Paperclip className="h-4.5 w-4.5" />}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => pick("image")}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Send a photo"
          >
            <Image className="h-4.5 w-4.5" />
          </button>
        </div>

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
