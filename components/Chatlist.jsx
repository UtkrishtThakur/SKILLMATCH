'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Pusher from "pusher-js";
import { fetchConversationsAction } from "@/app/actions/actions";

export default function ChatList({ currentUserId, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH CONVERSATIONS
  ========================= */

  const fetchConversations = async () => {
    setLoading(true);

    const res = await fetchConversationsAction();

    if (!res.success) {
      toast.error(res.error || "Failed to fetch chats");
      setLoading(false);
      return;
    }

    setConversations(res.data.conversations || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    const onRefresh = () => {
      fetchConversations();
    };

    window.addEventListener("refreshChatList", onRefresh);
    return () => window.removeEventListener("refreshChatList", onRefresh);
  }, []);

  /* =========================
     PUSHER REALTIME (UNCHANGED)
  ========================= */

  useEffect(() => {
    if (!currentUserId || typeof window === "undefined") return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);

    const handleNewMessage = (payload) => {
      if (!payload?.conversationId || !payload?.message) return;

      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => String(c._id) === String(payload.conversationId)
        );

        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            lastMessage: payload.message,
            updatedAt: new Date().toISOString(),
          };
          const [updated] = copy.splice(idx, 1);
          return [updated, ...copy];
        }

        return [
          {
            _id: payload.conversationId,
            members: [payload.sender, payload.receiver].filter(Boolean),
            lastMessage: payload.message,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    };

    channel.bind("new-message", handleNewMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId]);

  /* =========================
     UI — UNCHANGED
  ========================= */

  if (loading)
    return (
      <div className="p-4 text-white/70 text-center">
        Loading chats...
      </div>
    );

  if (!conversations.length)
    return (
      <div className="p-4 text-white/70 text-center">
        No conversations yet
      </div>
    );

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
      {conversations.map((conv) => {
        const members = conv.members ?? conv.participants ?? [];
        const otherUser =
          members.find(
            (m) => m?._id && String(m._id) !== String(currentUserId)
          ) || members.find((id) => String(id) !== String(currentUserId));

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
          conv.lastMessage?.text ??
          "";

        return (
          <div
            key={conv._id}
            onClick={() =>
              onSelectConversation
                ? onSelectConversation(conv)
                : null
            }
            className="flex items-center gap-3 p-3 rounded-xl bg-white/6 border border-white/10 hover:bg-white/8 cursor-pointer transition"
            role="button"
            tabIndex={0}
            aria-label={`Open conversation with ${otherUserName}`}
          >
            <Image
              src={otherUserPhoto}
              alt={otherUserName}
              width={56}
              height={56}
              className="rounded-full border border-white/8 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <p className="text-white font-semibold truncate">
                  {otherUserName}
                </p>
                <p className="text-xs text-white/50">
                  {conv.updatedAt
                    ? new Date(conv.updatedAt).toLocaleTimeString()
                    : ""}
                </p>
              </div>
              <p className="text-white/70 text-sm truncate mt-1">
                {lastMsg || "No messages yet"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
