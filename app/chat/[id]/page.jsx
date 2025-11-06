"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";
import ChatList from "@/components/ChatList";
import MessageBubble from "@/components/MessageBubble";
import { toast } from "react-hot-toast";
import Pusher from "pusher-js";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id;
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Load user info from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        setCurrentUserId(storedUser?._id || storedUser?.id || null);
      } catch {
        setCurrentUserId(null);
      }
    }
  }, []);

  // ---------------- Real-time listener ----------------
  useEffect(() => {
    if (!conversationId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`chat-${conversationId}`);

    const handleNewMessage = (msg) => {
      if (!msg) return;
      setMessages((prev) => {
        if (prev.some((x) => String(x._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
    };

    const handleDeleteMessage = (payload) => {
      if (!payload || !payload._id) return;
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(payload._id)));
    };

    channel.bind("new-message", handleNewMessage);
    channel.bind("delete-message", handleDeleteMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unbind("delete-message", handleDeleteMessage);
      pusher.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId]);

  // ---------------- Fetch initial messages ----------------
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in again — missing token");
          return;
        }

        const res = await fetch(`/api/chat/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) setMessages(data.messages || []);
        else toast.error(data.error || data.message || "Failed to load messages");
      } catch (err) {
        console.error("Fetch messages error:", err);
        toast.error("Network error while fetching messages");
      }
    };

    if (conversationId) fetchMessages();
  }, [conversationId]);

  // ---------------- Message sending handler ----------------
  const handleMessageSent = (m) => {
    if (!m) return;

    if (m.failed) {
      setMessages((prev) => prev.filter((x) => x._id !== m._id));
      return;
    }

    // Reconcile optimistic message with final
    if (m.tempId) {
      setMessages((prev) =>
        prev.map((x) => (x._id === m.tempId ? { ...x, ...m, _id: m._id } : x))
      );
      return;
    }

    // Add new message if not duplicate
    setMessages((prev) => {
      if (m._id && prev.some((x) => String(x._id) === String(m._id))) return prev;
      return [...prev, m];
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Conversation</h1>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Sidebar chat list */}
        <div className="w-1/4 bg-blue-900/50 rounded-xl p-2 overflow-y-auto">
          <ChatList conversationId={conversationId} />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-blue-900/40 rounded-xl p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={{
                  ...msg,
                  onDelete: async (id) => {
                    try {
                      const token = localStorage.getItem("token");
                      if (!token) return toast.error("Missing token");
                      const res = await fetch(`/api/chat/${conversationId}/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const data = await res.json();

                      if (!res.ok) toast.error(data.message || "Delete failed");
                      else if (data.deletedId) {
                        setMessages((prev) =>
                          prev.filter((m) => String(m._id) !== String(data.deletedId))
                        );
                      }
                    } catch (e) {
                      console.error("Delete error", e);
                      toast.error("Delete failed");
                    }
                  },
                }}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatBox
            conversationId={conversationId}
            token={localStorage.getItem("token")}
            senderId={currentUserId}
            onMessageSent={handleMessageSent}
          />
        </div>
      </div>
    </div>
  );
}
