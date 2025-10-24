"use client";

import React, { useEffect, useState } from "react";
import ChatList from "@/components/ChatList";
import Pusher from "pusher-js";

export default function ChatIndexPage() {
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUserId(u?._id || u?.id || null);
    } catch (e) {
      setCurrentUserId(null);
    }
  }, []);

  // ---------------- Real-time updates for ChatList ----------------
  useEffect(() => {
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    // Subscribe to user-specific channel for new conversations/messages
    const channel = pusher.subscribe(`user-${currentUserId}`);

    const handleNewConversation = (conv) => {
      // If ChatList supports a method to refresh or add conversation, call it
      const event = new CustomEvent("refreshChatList", { detail: conv });
      window.dispatchEvent(event);
    };

    channel.bind("new-conversation", handleNewConversation);

    return () => {
      channel.unbind("new-conversation", handleNewConversation);
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Your Chats</h2>
      <div className="flex gap-4">
        <div className="w-1/3 bg-blue-900/40 rounded-xl p-3 overflow-y-auto">
          <ChatList currentUserId={currentUserId} />
        </div>
        <div className="flex-1 bg-blue-900/30 rounded-xl p-6 flex items-center justify-center">
          <p className="text-gray-200">
            Select a conversation from the left to view messages.
          </p>
        </div>
      </div>
    </div>
  );
}
