"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatBox from "@/components/ChatBox";
import ChatList from "@/components/ChatList";
import MessageBubble from "@/components/MessageBubble";
import { getSocket, joinConversation, leaveConversation, sendMessage, onNewMessage, onDeleteMessage } from "@/lib/socket";
import { toast } from "react-hot-toast";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id;
  const [messages, setMessages] = useState([]);
  
  const messagesEndRef = useRef(null);
  const router = useRouter();

  // current user id from localStorage
  const [currentUserId, setCurrentUserId] = useState(null);

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    // set current user id safely
    if (typeof window !== "undefined") {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        setCurrentUserId(u?._id || u?.id || null);
      } catch (e) {
        setCurrentUserId(null);
      }
    }

    // Join socket room
    joinConversation(conversationId);

    // When a new message is received via socket, refetch the conversation
    // so the chatbox shows the persisted messages (simple, robust approach)
    const handler = async (msg) => {
      try {
        if (!msg) return;
        if (msg.conversationId && msg.conversationId !== conversationId) return;
        // refetch full message list to keep server as source-of-truth
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/chat/${conversationId}`, { headers });
        const data = await res.json();
        if (res.ok) setMessages(data.messages || []);
      } catch (e) {
        console.error("Error refetching messages on socket newMessage", e);
      }
    };
    const offNew = onNewMessage(handler);

    // handle deletes from socket (remove by id)
    const delHandler = (payload) => {
      if (!payload || !payload._id) return;
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(payload._id)));
    };
    const offDel = onDeleteMessage(delHandler);

    // Cleanup on unmount
    return () => {
      leaveConversation(conversationId);
      if (typeof offNew === "function") offNew();
      if (typeof offDel === "function") offDel();
    };
  }, [conversationId]);

  // Fetch initial conversation messages from API
  useEffect(() => {
    // Extracted fetch so it can be reused by socket handlers (reload conversation)
    const fetchMessages = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/chat/${conversationId}`, { headers });
        const data = await res.json();
        if (res.ok) setMessages(data.messages || []);
        else toast.error(data.error || data.message || "Failed to load messages");
      } catch (err) {
        console.error(err);
        toast.error("Network error while fetching messages");
      }
    };

    if (conversationId) fetchMessages();
  }, [conversationId]);

  // Note: sending is handled by ChatBox which POSTs to /api/chat and server emits the canonical message

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
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={{ ...msg, onDelete: async (id) => {
                try {
                  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                  const res = await fetch(`/api/chat/${conversationId}/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
                  const data = await res.json();
                  if (!res.ok) {
                    toast.error(data.message || 'Delete failed');
                  } else {
                    // remove locally if API returned deletedId (works when socket not connected)
                    if (data && data.deletedId) {
                      setMessages((prev) => prev.filter((m) => String(m._id) !== String(data.deletedId)));
                    }
                    // otherwise we rely on socket to emit deleteMessage
                  }
                } catch (e) {
                  console.error('Delete error', e);
                  toast.error('Delete failed');
                }
              } }} currentUserId={currentUserId} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <ChatBox
            conversationId={conversationId}
            token={typeof window !== "undefined" ? localStorage.getItem("token") : null}
            senderId={currentUserId}
            onMessageSent={(m) => {
              // handle optimistic, failed, or canonical
              if (!m) return;
              // failed optimistic removal
              if (m.failed) {
                setMessages((prev) => prev.filter((x) => x._id !== m._id));
                return;
              }
              // canonical with tempId: replace
              if (m.tempId) {
                setMessages((prev) => prev.map((x) => (x._id === m.tempId ? { ...m, _id: m._id } : x)));
                return;
              }
              // optimistic or canonical add
              setMessages((prev) => {
                if (m._id && prev.some((x) => String(x._id) === String(m._id))) return prev;
                return [...prev, m];
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
