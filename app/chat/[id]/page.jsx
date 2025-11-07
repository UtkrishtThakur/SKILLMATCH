'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import ChatBox from "@/components/ChatBox";
import ChatList from "@/components/ChatList";
import MessageBubble from "@/components/MessageBubble";
import Pusher from "pusher-js";
import { toast } from "react-hot-toast";

/**
 * ChatPage with:
 * - initial fetch that scrolls to bottom
 * - "infinite" load older messages when user scrolls to top of messages container
 * - preserves scroll position when older messages are prepended
 * - subscribes to pusher events for new messages and deletions
 * - message container is the only scrollable area (not whole page)
 *
 * Assumptions:
 * - Backend supports fetching older messages via query param `?before=<messageId>` or `?before=<ISO timestamp>`
 *   If your backend uses different param names adjust `fetchOlderMessages` accordingly.
 * - Existing endpoints `/api/chat/:conversationId` return { messages: [...] } (initial) and also support
 *   `/api/chat/:conversationId?before=<id>` to fetch older messages (page size determined server-side).
 * - Message objects have `_id` and `createdAt`.
 */

export default function ChatPage() {
  const params = useParams();
  const conversationId = params?.id;
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // pagination state
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  // Refs to manage scroll behavior
  const messagesContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const fetchingOlderRef = useRef(false);

  // scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    try {
      const el = messagesContainerRef.current;
      if (!el) return;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } catch (e) {
      // ignore
    }
  }, []);

  // load current user id from local storage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUser =
        JSON.parse(localStorage.getItem("skillmatch_user") || localStorage.getItem("user") || "null");
      setCurrentUserId(storedUser?._id || storedUser?.id || null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  // Listen to pusher for live updates
  useEffect(() => {
    if (!conversationId) return;
    if (typeof window === "undefined") return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true,
    });

    const channel = pusher.subscribe(`chat-${conversationId}`);

    const handleNewMessage = (msg) => {
      if (!msg) return;
      setMessages((prev) => {
        // dedupe by _id
        if (prev.some((x) => String(x._id) === String(msg._id))) return prev;
        return [...prev, msg];
      });
      // auto scroll to bottom only if user is near bottom (so they don't get forced while reading)
      const el = messagesContainerRef.current;
      if (el) {
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom < 200) {
          // small delay so item is rendered before scrolling
          setTimeout(() => scrollToBottom(true), 80);
        }
      }
    };

    const handleDelete = (payload) => {
      if (!payload || !payload._id) return;
      setMessages((prev) => prev.filter((m) => String(m._id) !== String(payload._id)));
    };

    channel.bind("new-message", handleNewMessage);
    channel.bind("delete-message", handleDelete);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      channel.unbind("delete-message", handleDelete);
      pusher.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId, scrollToBottom]);

  // initial fetch of messages for this conversation
  useEffect(() => {
    if (!conversationId) return;
    let mounted = true;
    setLoadingMessages(true);
    setHasMoreOlder(true);
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in again — missing token");
          setLoadingMessages(false);
          return;
        }
        const res = await fetch(`/api/chat/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const msgs = (data.messages || []).map((m) => ({ ...m }));
          if (!mounted) return;
          setMessages(msgs);
          // Wait a tick then jump to bottom *immediately* (no animation) on first load
          setTimeout(() => scrollToBottom(false), 40);
        } else {
          toast.error(data.error || data.message || "Failed to load messages");
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
        toast.error("Network error while fetching messages");
      } finally {
        if (!mounted) return;
        setLoadingMessages(false);
        isInitialLoadRef.current = false;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [conversationId, scrollToBottom]);

  // fetch older messages (prepend) using the oldest message _id as before param
  const fetchOlderMessages = useCallback(async () => {
    if (fetchingOlderRef.current) return;
    if (!hasMoreOlder) return;
    if (!conversationId) return;
    const el = messagesContainerRef.current;
    if (!el) return;

    const oldest = messages.length ? messages[0] : null;
    const beforeId = oldest ? oldest._id : null;

    fetchingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Missing token");
        setLoadingOlder(false);
        fetchingOlderRef.current = false;
        return;
      }

      // Measure scroll height before the request so we can restore position
      const prevScrollHeight = el.scrollHeight;

      const url = beforeId
        ? `/api/chat/${conversationId}?before=${encodeURIComponent(beforeId)}`
        : `/api/chat/${conversationId}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch older messages");
      } else {
        const older = (data.messages || []).map((m) => ({ ...m }));
        if (!older.length) {
          setHasMoreOlder(false);
        } else {
          // Prepend while avoiding duplicates
          setMessages((prev) => {
            const ids = new Set(prev.map((p) => String(p._id)));
            const filtered = older.filter((m) => !ids.has(String(m._id)));
            if (!filtered.length) return prev;
            const next = [...filtered, ...prev];

            // Wait for DOM to update then adjust scrollTop so the user's view stays at same message
            // We'll calculate new scrollTop = el.scrollTop + (el.scrollHeight - prevScrollHeight)
            setTimeout(() => {
              try {
                const addedHeight = el.scrollHeight - prevScrollHeight;
                if (typeof addedHeight === "number" && !Number.isNaN(addedHeight)) {
                  el.scrollTop = el.scrollTop + addedHeight;
                }
              } catch (e) {
                // fallback: don't crash on adjust
              }
            }, 40);

            return next;
          });
        }
      }
    } catch (err) {
      console.error("Error fetching older messages", err);
      toast.error("Network error");
    } finally {
      setLoadingOlder(false);
      fetchingOlderRef.current = false;
    }
  }, [conversationId, hasMoreOlder, messages]);

  // scroll handler to detect when user reaches near top to load older messages
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          // If user scrolled within 120px from top, load older messages
          if (el.scrollTop < 120) {
            if (!loadingOlder && hasMoreOlder) {
              fetchOlderMessages();
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          ticking = false;
        }
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [fetchOlderMessages, hasMoreOlder, loadingOlder]);

  // Called by ChatBox optimistic flow
  const handleMessageSent = (m) => {
    if (!m) return;
    if (m.failed) {
      // remove optimistic failed
      setMessages((prev) => prev.filter((x) => x._id !== m._id));
      return;
    }
    // reconcile optimistic -> canonical
    if (m.tempId) {
      setMessages((prev) =>
        prev.map((x) => (String(x._id) === String(m.tempId) ? { ...x, ...m, _id: m._id } : x))
      );
      return;
    }
    setMessages((prev) => {
      if (m._id && prev.some((x) => String(x._id) === String(m._id))) return prev;
      return [...prev, m];
    });

    // scroll to bottom when we send a new message
    setTimeout(() => scrollToBottom(true), 60);
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8 select-none">
      {/* subtle blobs like other pages */}
      <svg aria-hidden="true" className="hidden sm:block absolute -top-36 -left-36 w-[420px] h-[420px] opacity-6 blur-3xl" viewBox="0 0 600 600">
        <circle cx="300" cy="300" r="300" fill="white" fillOpacity="0.06" />
      </svg>

      {/* main bigger card */}
      <div className="relative z-20 w-full max-w-6xl bg-[#1d365e] text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/20 flex gap-4" style={{ minHeight: "70vh", marginTop: "2.5rem" }}>
        {/* left: chat list */}
        <aside className="w-80 md:w-96 max-w-[32%] bg-white/6 rounded-2xl p-3 overflow-y-auto border border-white/10">
          <h3 className="text-lg font-semibold mb-3">Chats</h3>
          <div style={{ height: 'calc(70vh - 80px)' }}>
            <ChatList currentUserId={currentUserId} onSelectConversation={(conv) => {
              const ev = new CustomEvent('selectConversation', { detail: conv });
              window.dispatchEvent(ev);
              if (conv && conv._id && window.location.pathname !== `/chat/${conv._id}`) {
                window.location.href = `/chat/${conv._id}`;
              } else {
                window.dispatchEvent(new CustomEvent("refreshChatList"));
              }
            }} />
          </div>
        </aside>

        {/* right: messages area */}
        <section className="flex-1 flex flex-col bg-white/6 rounded-2xl p-4 border border-white/10">
          {/* header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold truncate">Conversation</h2>
            <div className="text-sm text-white/70">Realtime · Secure</div>
          </div>

          {/* messages container: only this scrolls */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pr-2 space-y-2"
            style={{ minHeight: 0, maxHeight: 'calc(70vh - 140px)' }}
          >
            {/* "load older" indicator */}
            {loadingOlder && (
              <div className="flex items-center justify-center py-2">
                <div className="text-white/70 text-sm">Loading earlier messages...</div>
              </div>
            )}

            {loadingMessages ? (
              <div className="flex items-center justify-center h-56">
                <div className="text-white/70">Loading messages...</div>
              </div>
            ) : messages.length ? (
              messages.map((msg) => (
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
                          setMessages((prev) => prev.filter((m) => String(m._id) !== String(data.deletedId)));
                        }
                      } catch (e) {
                        console.error("Delete error", e);
                        toast.error("Delete failed");
                      }
                    },
                  }}
                  currentUserId={currentUserId}
                />
              ))
            ) : (
              <div className="text-white/60 p-6">No messages yet — say hi 👋</div>
            )}
          </div>

          <div className="mt-3">
            <ChatBox
              conversationId={conversationId}
              token={localStorage.getItem("token")}
              senderId={currentUserId}
              onMessageSent={handleMessageSent}
            />
          </div>
        </section>
      </div>

      <style jsx>{`
        .blur-3xl { filter: blur(28px); }
        @media (max-width: 720px) {
          .relative.z-20 { flex-direction: column; padding: 12px; gap: 12px; }
          aside { width: 100% !important; max-width: 100% !important; }
          section { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}