"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ChatList({ currentUserId, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat/conversations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setConversations(data.conversations || []);
        } else {
          toast.error(data.error || "Failed to fetch chats");
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error fetching chats");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [token]);

  if (loading)
    return (
      <div className="p-4 text-gray-400 text-center">
        Loading chats...
      </div>
    );

  if (conversations.length === 0)
    return (
      <div className="p-4 text-gray-400 text-center">
        No conversations yet
      </div>
    );

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[80vh]">
      {conversations.map((conv) => {
        // support both `members` (client) and `participants` (server)
        const members = conv.members ?? conv.participants ?? [];
        const otherUser = members.find((m) => m._id !== currentUserId);
        if (!otherUser) return null;

        return (
          <div
            key={conv._id}
            onClick={() => {
              if (onSelectConversation) onSelectConversation(conv);
              else router.push(`/chat/${conv._id}`);
            }}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-700 cursor-pointer transition-all"
          >
            <Image
              src={otherUser.profilePhoto || "/default-avatar.png"}
              alt={otherUser.name}
              width={50}
              height={50}
              className="rounded-full border border-blue-500"
            />
            <div className="flex-1">
              <p className="text-white font-medium">{otherUser.name}</p>
              <p className="text-gray-300 text-sm truncate">{conv.lastMessage?.content ?? (otherUser.skills || []).join(", ")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
