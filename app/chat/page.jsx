"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";


export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch conversations");
        const data = await res.json();
        setConversations(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchConversations();
  }, [token]);

  const handleSelectConversation = (conversationId) => {
    router.push(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-950 text-white">
        Loading chats...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <h1 className="text-3xl font-bold p-4 border-b border-gray-800">Chats</h1>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No chats yet
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => handleSelectConversation(conv._id)}
              className="flex items-center p-4 cursor-pointer hover:bg-gray-800 transition"
            >
              <Image
                src={conv.otherUser?.image || "/default-avatar.png"}
                alt={conv.otherUser?.name || "User"}
                width={45}
                height={45}
                className="rounded-full mr-3"
              />
              <div className="flex flex-col">
                <span className="font-semibold">{conv.otherUser?.name || "Unknown"}</span> 
                <span className="text-sm text-gray-400 truncate w-60">
                  {conv.lastMessage || "No messages yet"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
