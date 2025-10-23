"use client";

import React, { useEffect, useState } from "react";
import ChatList from "@/components/ChatList";

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

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
      <h2 className="text-2xl font-bold mb-4">Your Chats</h2>
      <div className="flex gap-4">
        <div className="w-1/3 bg-blue-900/40 rounded-xl p-3">
          <ChatList currentUserId={currentUserId} />
        </div>
        <div className="flex-1 bg-blue-900/30 rounded-xl p-6 flex items-center justify-center">
          <p className="text-gray-200">Select a conversation from the left to view messages.</p>
        </div>
      </div>
    </div>
  );
}
