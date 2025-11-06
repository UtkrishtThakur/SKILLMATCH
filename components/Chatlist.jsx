"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Pusher from "pusher-js";

export default function ChatList({ currentUserId, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();

  // ---------------- Load token safely ----------------
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("token");
      if (stored) setToken(stored);
      else toast.error("Missing token — please log in again");
    }
  }, []);

  // ---------------- Fetch initial conversations ----------------
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
          toast.error(data.error || data.message || "Failed to fetch chats");
        }
      } catch (err) {
        console.error("ChatList fetch error:", err);
        toast.error("Network error fetching chats");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [token]);

  // ---------------- Real-time Pusher subscription ----------------
  useEffect(() => {
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);

    const handleNewMessage = (payload) => {
      if (!payload?.conversationId || !payload?.message) return;

      setConversations((prev) => {
        const existing = prev.find(
          (c) => String(c._id) === String(payload.conversationId)
        );
        if (existing) {
          // Update the last message preview
          return prev.map((c) =>
            String(c._id) === String(payload.conversationId)
              ? { ...c, lastMessage: payload.message }
              : c
          );
        } else {
          // If it's a new chat (user started talking recently)
          return [
            {
              _id: payload.conversationId,
              members: [payload.sender, payload.receiver].filter(Boolean),
              lastMessage: payload.message,
            },
            ...prev,
          ];
        }
      });
    };

    channel.bind("new-message", handleNewMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId]);

  // ---------------- Loading & Empty states ----------------
  if (loading)
    return <div className="p-4 text-gray-400 text-center">Loading chats...</div>;

  if (conversations.length === 0)
    return <div className="p-4 text-gray-400 text-center">No conversations yet</div>;

  // ---------------- Render Conversations ----------------
  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[80vh]">
      {conversations.map((conv) => {
        const members = conv.members ?? conv.participants ?? [];
        const otherUser =
          members.find((m) => m?._id && m._id !== currentUserId) ||
          members.find((id) => id !== currentUserId);

        const otherUserName =
          typeof otherUser === "object"
            ? otherUser.name || otherUser.username || "Unknown User"
            : "Unknown User";

        const otherUserPhoto =
          typeof otherUser === "object"
            ? otherUser.profilePhoto || "/default-avatar.png"
            : "/default-avatar.png";

        const lastMsg =
          conv.lastMessage?.content ??
          (typeof otherUser === "object"
            ? (otherUser.skills || []).join(", ")
            : "");

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
              src={otherUserPhoto}
              alt={otherUserName}
              width={50}
              height={50}
              className="rounded-full border border-blue-500 object-cover"
            />
            <div className="flex-1">
              <p className="text-white font-medium">{otherUserName}</p>
              <p className="text-gray-300 text-sm truncate">{lastMsg}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
