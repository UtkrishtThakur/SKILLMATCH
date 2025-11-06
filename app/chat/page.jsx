"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatList from "@/components/ChatList";
import Pusher from "pusher-js";

export default function ChatIndexPage() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const router = useRouter();

  // ✅ Independent user load
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Check multiple keys since user can be stored differently
      const storedUser =
        JSON.parse(localStorage.getItem("skillmatch_user") || "null") ||
        JSON.parse(localStorage.getItem("user") || "null");

      const userId = storedUser?._id || storedUser?.id || null;
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        console.warn("No user found — redirecting to login");
        router.push("/auth/login");
        return;
      }

      setCurrentUserId(userId);
    } catch (err) {
      console.error("Failed to parse local user:", err);
      router.push("/auth/login");
    }
  }, [router]);

  // ✅ Real-time Pusher setup
  useEffect(() => {
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);
    const handleNewConversation = (conv) => {
      const event = new CustomEvent("refreshChatList", { detail: conv });
      window.dispatchEvent(event);
    };

    channel.bind("new-conversation", handleNewConversation);

    return () => {
      channel.unbind("new-conversation", handleNewConversation);
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId]);

  // ✅ Optional: loading fallback
  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
        <p className="animate-pulse text-lg font-medium">
          Initializing chat...
        </p>
      </div>
    );
  }

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
