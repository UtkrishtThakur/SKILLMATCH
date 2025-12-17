"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Pusher from "pusher-js";
import { toast } from "react-hot-toast";
import { useNotifications } from "@/context/NotificationContext";

// Renovation Note:
// We are replacing the simple ChatBox/MessageBubble components with inline styled
// elements to ensure total control over the "Purple/Glass" aesthetic without
// breaking the prop drilling logic.
// Logic for Pusher, Fetching, and Scroll is PRESERVED.

export default function ChatWindowPage() {
  const params = useParams();
  const conversationId = params?.id;

  const { setUnreadChats } = useNotifications(); // ⚡ Context hook

  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Pagination
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  // Input State
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Refs
  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const fetchingOlderRef = useRef(false);

  // --- LOGIC: SCROLL ---
  const scrollToBottom = useCallback((smooth = true) => {
    try {
      const el = messagesContainerRef.current;
      if (!el) return;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } catch (e) { /* ignore */ }
  }, []);

  // --- LOGIC: AUTH ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUser = JSON.parse(localStorage.getItem("skillmatch_user") || localStorage.getItem("user") || "null");
      setCurrentUserId(storedUser?._id || storedUser?.id || null);
    } catch { setCurrentUserId(null); }
  }, []);

  // --- LOGIC: PUSHER ---
  useEffect(() => {
    if (!conversationId || typeof window === "undefined") return;

    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      console.warn("Pusher Key Missing");
      return;
    }

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
      // Auto-scroll if near bottom
      const el = messagesContainerRef.current;
      if (el) {
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (dist < 200) setTimeout(() => scrollToBottom(true), 80);
      }
    };

    const handleDelete = (payload) => {
      if (!payload?._id) return;
      setMessages(prev => prev.filter(m => String(m._id) !== String(payload._id)));
    };

    channel.bind("new-message", handleNewMessage);
    channel.bind("delete-message", handleDelete);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unbind("delete-message", handleDelete);
      pusher.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId, scrollToBottom]);

  // --- LOGIC: FETCH MESSAGES ---
  useEffect(() => {
    if (!conversationId) return;
    let mounted = true;
    setLoadingMessages(true);
    setHasMoreOlder(true);

    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return; // Silent return or redirect
        const res = await fetch(`/api/chat/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          if (mounted) {
            setMessages((data.messages || []).map(m => ({ ...m })));
            setTimeout(() => scrollToBottom(false), 40);

            // ⚡ Sync Notification State: Check if we still have unread messages elsewhere
            // If not, clear the global red dot.
            fetch("/api/notifications/unread", {
              headers: { Authorization: `Bearer ${token}` }
            })
              .then(r => r.json())
              .then(d => {
                if (!d.unreadChats) setUnreadChats(false);
              })
              .catch(err => console.error("Sync error:", err));
          }
        } else {
          toast.error("Failed to load conversation");
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoadingMessages(false);
        isInitialLoadRef.current = false;
      }
    })();
    return () => { mounted = false; };
  }, [conversationId, scrollToBottom]);

  // --- LOGIC: FETCH OLDER ---
  const fetchOlderMessages = useCallback(async () => {
    if (fetchingOlderRef.current || !hasMoreOlder || !conversationId) return;
    const el = messagesContainerRef.current;
    if (!el) return;

    const oldest = messages[0];
    const beforeId = oldest?._id;

    fetchingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const prevHeight = el.scrollHeight;
      const url = `/api/chat/${conversationId}${beforeId ? `?before=${encodeURIComponent(beforeId)}` : ''}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();

      if (res.ok) {
        const older = data.messages || [];
        if (older.length === 0) setHasMoreOlder(false);
        else {
          setMessages(prev => {
            const ids = new Set(prev.map(p => String(p._id)));
            const filtered = older.filter(m => !ids.has(String(m._id)));
            return [...filtered, ...prev];
          });
          // Restore Scroll
          setTimeout(() => {
            const added = el.scrollHeight - prevHeight;
            if (added > 0) el.scrollTop += added;
          }, 40);
        }
      }
    } catch (err) {
      console.error("Older fetch error", err);
    } finally {
      setLoadingOlder(false);
      fetchingOlderRef.current = false;
    }
  }, [conversationId, hasMoreOlder, messages]);

  // --- LOGIC: SCROLL DETECTOR ---
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

  // --- LOGIC: SEND MESSAGE ---
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    const tempId = "temp-" + Date.now();
    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic
    const optimisticMsg = {
      _id: tempId,
      content,
      sender: { _id: currentUserId }, // Mock sender for display
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 60);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/chat/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      const data = await res.json();

      if (res.ok) {
        setMessages(prev => prev.map(m => m._id === tempId ? data.message : m));
      } else {
        toast.error(data.error || "Failed to send");
        setMessages(prev => prev.filter(m => m._id !== tempId));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      toast.error("Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-8 px-4 md:px-8 relative overflow-hidden selection:bg-fuchsia-500/30 font-sans">

      {/* Background */}
      <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10 h-[calc(100vh-8rem)] flex flex-col bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">

        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center z-20">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-fuchsia-200">
              Chat Room
            </h2>
            <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Encrypted & Realtime
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/chat'}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide"
        >
          {loadingOlder && (
            <div className="flex justify-center py-2">
              <span className="text-xs text-slate-500 animate-pulse">Loading history...</span>
            </div>
          )}

          {loadingMessages ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mr-3"></div>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <span className="text-4xl mb-2">👋</span>
              <p>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = String(msg.sender?._id || msg.sender) === String(currentUserId);
              // Check if chain
              const prevMsg = messages[idx - 1];
              const isChain = prevMsg && String(prevMsg.sender?._id || prevMsg.sender) === String(msg.sender?._id || msg.sender);

              return (
                <div key={msg._id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isChain ? 'mt-1' : 'mt-4'}`}>
                  <div className={`max-w-[75%] md:max-w-[60%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm relative group
                              ${isMe
                      ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-none'
                      : 'bg-white/10 border border-white/5 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                    <div className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-violet-200' : 'text-slate-400'} text-right`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/50 backdrop-blur-xl z-20">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-full pl-5 pr-12 py-3 focus:outline-none focus:border-violet-500/50 text-white placeholder-slate-500 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:block">
                <kbd className="px-2 py-0.5 rounded bg-white/5 text-slate-500 text-[10px] border border-white/5 font-mono">ENTER</kbd>
              </div>
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full text-black shadow-lg hover:shadow-emerald-500/20 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg> /* Using Up Arrow for send style */
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}