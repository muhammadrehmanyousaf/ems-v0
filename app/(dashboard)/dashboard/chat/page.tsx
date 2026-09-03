"use client";

import React, { useEffect } from "react";
import { ChatArtifact } from "@/components/dashboard/mainScreens/chat/artifact/chat-artifact";

export default function ChatPage() {
  // BUG-007 — client component can't export `metadata`, so the tab title fell
  // back to the generic "Wedding Wala — Dashboard". Give it a specific title.
  useEffect(() => {
    document.title = "Dashboard : Messages";
  }, []);

  return <ChatArtifact />;
}
