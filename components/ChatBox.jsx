"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Pusher from "pusher-js";

export default function ChatBox({ conversationId, senderId, token, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Keep track of optimistic message IDs
  const optimisticIds = useRef(new Set());

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

      // Ignore messages sent by self (by tempId)
      if (msg.tempId && optimisticIds.current.has(msg.tempId)) return;

      if (onMessageSent) onMessageSent(msg);
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
    if (!conversationId || !token) return toast.error("Cannot send message");

    setSending(true);
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const storedUser = typeof window !== "undefined"
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

    // Add to tempId set
    optimisticIds.current.add(tempId);

    // Show optimistic message
    if (onMessageSent) onMessageSent(optimistic);

    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: message, tempId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || data.message || "Failed to send message");
        if (onMessageSent) onMessageSent({ _id: tempId, failed: true });
      } else {
        setMessage("");

        // Remove tempId after successful send
        optimisticIds.current.delete(tempId);

        // Reconcile optimistic message with canonical one
        const canonical = data.data || data.message || null;
        if (canonical && onMessageSent)
          onMessageSent({ ...canonical, tempId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
      if (onMessageSent) onMessageSent({ _id: tempId, failed: true });
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
