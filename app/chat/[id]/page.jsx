"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Pusher from "pusher-js";
import { toast } from "react-hot-toast";
import { useNotifications } from "@/context/NotificationContext";
import MessageBubble from "@/components/MessageBubble";
import {
  fetchMessagesAction,
  sendMessageAction,
  fetchUnreadNotificationsAction,
} from "@/app/actions/actions";

export default function ChatWindowPage() {
  const params = useParams();
  const conversationId = params?.id;

  const { setUnreadChats } = useNotifications();

  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const fetchingOlderRef = useRef(false);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("skillmatch_user") ||
        localStorage.getItem("user") ||
        "null"
      );
      setCurrentUserId(storedUser?._id || storedUser?.id || null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`chat-${conversationId}`);

    const onNew = (msg) => {
      if (!msg) return;
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });

      const el = messagesContainerRef.current;
      if (el) {
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (dist < 200) setTimeout(() => scrollToBottom(true), 80);
      }
    };

    const onDelete = (payload) => {
      if (!payload?._id) return;
      setMessages((prev) =>
        prev.filter((m) => String(m._id) !== String(payload._id))
      );
    };

    channel.bind("new-message", onNew);
    channel.bind("delete-message", onDelete);

    return () => {
      channel.unbind("new-message", onNew);
      channel.unbind("delete-message", onDelete);
      pusher.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    if (!conversationId) return;
    let mounted = true;

    setLoadingMessages(true);
    setHasMoreOlder(true);

    (async () => {
      try {
        const res = await fetchMessagesAction(conversationId);

        if (res.success && mounted) {
          setMessages(res.data.messages || []);
          setTimeout(() => scrollToBottom(false), 40);

          const notif = await fetchUnreadNotificationsAction();
          if (notif.success && !notif.data?.unreadChats) {
            setUnreadChats(false);
          }
        } else {
          toast.error("Failed to load conversation");
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoadingMessages(false);
        isInitialLoadRef.current = false;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [conversationId, scrollToBottom, setUnreadChats]);

  const fetchOlderMessages = useCallback(async () => {
    if (
      fetchingOlderRef.current ||
      !hasMoreOlder ||
      !conversationId ||
      messages.length === 0
    )
      return;

    const el = messagesContainerRef.current;
    if (!el) return;

    fetchingOlderRef.current = true;
    setLoadingOlder(true);

    const oldest = messages[0];
    const before = oldest?.createdAt;
    const prevHeight = el.scrollHeight;

    try {
      const res = await fetchMessagesAction(conversationId, { before });

      if (res.success) {
        const older = res.data.messages || [];
        if (older.length === 0) {
          setHasMoreOlder(false);
        } else {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => String(m._id)));
            const filtered = older.filter(
              (m) => !ids.has(String(m._id))
            );
            return [...filtered, ...prev];
          });

          setTimeout(() => {
            const added = el.scrollHeight - prevHeight;
            if (added > 0) el.scrollTop += added;
          }, 40);
        }
      }
    } catch (e) {
      console.error("Older fetch error", e);
    } finally {
      fetchingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [conversationId, hasMoreOlder, messages]);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (el.scrollTop < 120 && !loadingOlder && hasMoreOlder) {
        fetchOlderMessages();
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [fetchOlderMessages, hasMoreOlder, loadingOlder]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    const tempId = "temp-" + Date.now();

    setNewMessage("");
    setSending(true);

    const optimistic = {
      _id: tempId,
      content,
      sender: { _id: currentUserId },
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(true), 60);

    try {
      const res = await sendMessageAction(
        conversationId,
        content,
        tempId
      );

      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId ? res.data.message : m
          )
        );
      } else {
        toast.error(res.error || "Failed to send");
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    } catch (e) {
      console.error(e);
      toast.error("Send failed");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-8 px-4 md:px-8 relative overflow-hidden">
      <div className="fixed inset-0 z-0 animate-aurora opacity-20 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10 h-[calc(100vh-8rem)] flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-fuchsia-200">
              Chat Room
            </h2>
            <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Encrypted & Realtime
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/chat")}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-400"
          >
            ✕
          </button>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 scrollbar-hide"
        >
          {loadingOlder && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-slate-500 animate-pulse">
                Loading history...
              </span>
            </div>
          )}

          {loadingMessages ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/50">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-full px-5 py-3"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
            >
              {sending ? "..." : "↑"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
