'use client';

import React, { useEffect, useState } from "react";
import ChatList from "@/components/ChatList";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";

export default function ChatIndexPage() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const router = useRouter();

  // load user/token
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUser = JSON.parse(localStorage.getItem("skillmatch_user") || localStorage.getItem("user") || "null");
      const userId = storedUser?._id || storedUser?.id || null;
      const token = localStorage.getItem("token");
      if (!userId || !token) {
        router.push("/auth/login");
        return;
      }
      setCurrentUserId(userId);
    } catch (err) {
      console.error("Failed to parse local user:", err);
      router.push("/auth/login");
    }
  }, [router]);

  // listen for new conversation events and ask ChatList to refresh via window event
  useEffect(() => {
    if (!currentUserId) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);
    const handleNewConversation = (conv) => {
      window.dispatchEvent(new CustomEvent("refreshChatList", { detail: conv }));
    };

    channel.bind("new-conversation", handleNewConversation);
    return () => {
      channel.unbind("new-conversation", handleNewConversation);
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="animate-pulse text-[#1d365e]">Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-6xl bg-[#1d365e] text-white rounded-3xl p-8 shadow-2xl border border-white/20">
        <h2 className="text-2xl font-bold mb-4 text-center">Your Chats</h2>
        <div className="flex gap-6">
          <div className="w-80 md:w-96 bg-white/6 rounded-2xl p-3 overflow-y-auto">
            <ChatList currentUserId={currentUserId} />
          </div>
          <div className="flex-1 bg-white/6 rounded-2xl p-8 flex items-center justify-center">
            <p className="text-white/60">Select a conversation to start messaging.</p>
          </div>
        </div>
      </div>
    </div>
  );
}