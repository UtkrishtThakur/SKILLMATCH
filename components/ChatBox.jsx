"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Pusher from "pusher-js";

export default function ChatBox({ conversationId, senderId, token: propToken, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState(propToken || null);
  const optimisticIds = useRef(new Set());

  // ✅ Restore token & user if missing (so chat works even on direct /chat load)
  useEffect(() => {
    if (token) return;
    if (typeof window === "undefined") return;

    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, [token]);

  // ---------------- Real-time Pusher listener ----------------
  useEffect(() => {
    if (!conversationId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`chat-${conversationId}`);

    const handleIncoming = (msg) => {
      if (!msg) return;
      if (msg.tempId && optimisticIds.current.has(msg.tempId)) return;
      onMessageSent?.(msg);
    };

    channel.bind("new-message", handleIncoming);

    return () => {
      channel.unbind("new-message", handleIncoming);
      pusher.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId, onMessageSent]);

  // ---------------- Sending message ----------------
  const handleSend = async () => {
    if (!message.trim()) return;

    // ✅ Auto-restore token if somehow still missing
    let activeToken = token;
    if (!activeToken && typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        activeToken = storedToken;
      }
    }

    if (!conversationId || !activeToken) {
      return toast.error("Cannot send message — missing session.");
    }

    setSending(true);
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const storedUser =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "null")
        : null;

    const optimistic = {
      _id: tempId,
      conversationId,
      content: message,
      createdAt: new Date().toISOString(),
      sender: {
        _id: senderId || storedUser?._id || storedUser?.id || null,
        name: storedUser?.name || null,
        profilePhoto: storedUser?.profilePhoto || null,
      },
      optimistic: true,
      tempId,
    };

    optimisticIds.current.add(tempId);
    onMessageSent?.(optimistic);

    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ content: message, tempId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || data.message || "Failed to send message");
        onMessageSent?.({ _id: tempId, failed: true });
      } else {
        setMessage("");
        optimisticIds.current.delete(tempId);

        const canonical = data.data || data.message || null;
        if (canonical) onMessageSent?.({ ...canonical, tempId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
      onMessageSent?.({ _id: tempId, failed: true });
    } finally {
      setSending(false);
    }
  };

  const handleEnterPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-t border-gray-700">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleEnterPress}
        placeholder="Type a message..."
        className="flex-1 p-2 rounded-md bg-gray-800 text-white resize-none focus:outline-none"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={sending}
        className="bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600 transition"
      >
        {sending ? "Sending..." : "Send"}
      </button>
    </div>
  );
}
