"use client";

import React, { useState } from "react";
import { toast } from "react-hot-toast";

export default function ChatBox({ conversationId, senderId, token, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!conversationId || !token) return toast.error("Cannot send message");
    setSending(true);
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const storedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
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
    };

    // call parent immediately to show optimistic UI
    if (typeof onMessageSent === "function") onMessageSent(optimistic);

    try {
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: message, tempId }), // server will echo tempId
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || data.message || "Failed to send message");
        // remove optimistic by notifying parent with a failure shape (parent should remove by id)
        if (typeof onMessageSent === "function") onMessageSent({ _id: tempId, failed: true });
      } else {
        // server will emit canonical message via socket; we also include canonical in response
        // ensure input cleared
        setMessage("");
        // If response contains canonical message synchronously, parent can reconcile
        const canonical = data.data || data.message || null;
        if (canonical && typeof onMessageSent === "function") onMessageSent({ ...canonical, tempId: data.tempId ?? null });
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
      if (typeof onMessageSent === "function") onMessageSent({ _id: tempId, failed: true });
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
