'use client';

import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { toast } from "react-hot-toast";
import MessageBubble from "./MessageBubble";

export default function ChatBox({
  conversationId,
  senderId,
  token: propToken,
  onMessageSent,
  messages: propMessages = null, // optional - parent can pass messages array
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState(propToken || null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // internal messages only used if parent doesn't pass messages
  const [internalMessages, setInternalMessages] = useState([]);

  // set to track optimistic IDs
  const optimisticIds = useRef(new Set());
  const textareaRef = useRef(null);

  // scrollable messages container ref
  const msgsRef = useRef(null);
  // To track previous scroll height for maintaining position
  const prevScrollHeightRef = useRef(0);

  // restore token if missing (original behaviour)
  useEffect(() => {
    if (token) return;
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, [token]);

  // auto expand textarea height (exactly as you had it)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [message]);

  // helper to get active messages array to render
  const activeMessages = propMessages || internalMessages;
  const lastMessageRef = useRef(null);
  const messagesLengthRef = useRef(activeMessages.length);

  // Auto-scroll to bottom logic
  useLayoutEffect(() => {
    const el = msgsRef.current;
    if (!el) return;

    // Logic:
    // 1. If we added messages at the BEGINNING (pagination), restore scroll position.
    // 2. If we added messages at the END (new message), scroll to bottom.
    // 3. Initial load -> scroll to bottom.

    const newLength = activeMessages.length;
    const oldLength = messagesLengthRef.current;
    const addedCount = newLength - oldLength;

    if (addedCount > 0 && loadingMore) {
      // We loaded more messages at the top
      // Restore scroll position
      const newScrollHeight = el.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      el.scrollTop += diff;
      setLoadingMore(false); // Reset flag
    } else if (newLength > oldLength || newLength === 0) {
      // Likely a new message sent or received or initial load
      // Only scroll to bottom if we were already near bottom OR if it's the very first load
      // For now, let's keep it simple: always scroll to bottom on new message
      el.scrollTop = el.scrollHeight;
    }

    messagesLengthRef.current = newLength;
    prevScrollHeightRef.current = el.scrollHeight;
  }, [activeMessages, loadingMore]);


  // Helper to fetch messages (for pagination)
  const fetchMessages = useCallback(async (beforeDate = null) => {
    if (!conversationId || !token) return;
    try {
      const url = `/api/chat/${conversationId}?limit=20${beforeDate ? `&before=${beforeDate}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        const fetched = data.messages || [];
        if (fetched.length < 20) {
          setHasMore(false);
        }

        if (beforeDate) {
          // Prepend
          setInternalMessages(prev => [...fetched, ...prev]);
        } else {
          // Initial load replacement if needed, but usually we handle internalMessages merging
          // Actually if calling fetchMessages it implies we want to load into internal state
          if (fetched.length > 0) {
            setInternalMessages(prev => {
              // prevent duplicates just in case
              const existingIds = new Set(prev.map(m => m._id));
              const uniqueFetched = fetched.filter(m => !existingIds.has(m._id));
              return [...uniqueFetched, ...prev]; // actually fetching "before" usually prepends, but fetching "latest" implies replacing or merging?
              // If we fetched "latest" (no beforeDate), we likely want to just set them or append if we assume we are at start.
              // BUT, if parent is not managing messages, we should probably just set expected behavior.
              // For simplicity: If no propMessages, we rely on internal.
              // If invalidating, we set.
              return fetched;
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  }, [conversationId, token]);

  const handleScroll = () => {
    const el = msgsRef.current;
    if (!el) return;
    if (el.scrollTop === 0 && hasMore && !loadingMore && activeMessages.length > 0) {
      setLoadingMore(true);
      prevScrollHeightRef.current = el.scrollHeight; // capture height before load
      const oldest = activeMessages[0];
      fetchMessages(oldest.createdAt);
    }
  };


  // when a message is sent / returned we merge it into internalMessages if parent not controlling
  const pushOrReplaceMessage = (msg) => {
    if (propMessages) {
      // parent controls messages — just call callback and return
      onMessageSent?.(msg);
      return;
    }

    setInternalMessages((prev) => {
      // if msg has tempId and matches existing optimistic -> replace
      if (msg.tempId) {
        const idx = prev.findIndex((m) => m.tempId === msg.tempId || m._id === msg.tempId);
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...msg };
          return copy;
        }
      }

      // if updating a failed optimistic message by _id
      if (msg._id && prev.some((m) => m._id === msg._id)) {
        return prev.map((m) => (m._id === msg._id ? { ...m, ...msg } : m));
      }

      return [...prev, msg];
    });

    onMessageSent?.(msg);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    let activeToken = token;
    if (!activeToken && typeof window !== "undefined") {
      activeToken = localStorage.getItem("token");
      setToken(activeToken);
    }

    if (!conversationId || !activeToken) return toast.error("Cannot send message — missing session.");

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
        _id: senderId || storedUser?._id || storedUser?.id || null, // ensure ID is available
        name: storedUser?.name || null,
        profilePhoto: storedUser?.profilePhoto || null,
      },
      optimistic: true,
      tempId,
    };

    optimisticIds.current.add(tempId);

    // push optimistic locally if parent not managing messages, otherwise rely on parent
    pushOrReplaceMessage(optimistic);

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
        // mark optimistic as failed
        pushOrReplaceMessage({ _id: tempId, failed: true, tempId });
      } else {
        // clear input
        setMessage("");
        optimisticIds.current.delete(tempId);

        // canonical message from server
        const canonical = data.data || data.message || null;

        // if server returns a canonical message, merge it (preserve tempId so parent can reconcile)
        if (canonical) {
          // ensure canonical has _id
          const serverMsg = { ...canonical, tempId };
          pushOrReplaceMessage(serverMsg);
        } else {
          // no canonical returned — mark optimistic as delivered (remove optimistic flag)
          pushOrReplaceMessage({ _id: tempId, optimistic: false, tempId });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
      pushOrReplaceMessage({ _id: tempId, failed: true, tempId });
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
    <div className="flex flex-col gap-2 w-full max-w-full">
      {/* Messages pane - this is the ONLY thing that scrolls */}
      <div
        ref={msgsRef}
        onScroll={handleScroll}
        className="w-full overflow-y-auto p-3 space-y-3 rounded-xl bg-transparent scroll-smooth"
        style={{
          maxHeight: "calc(100vh - 350px)",
          minHeight: "300px",
          willChange: "transform",
        }}
        aria-live="polite"
      >
        {loadingMore && <div className="text-center text-xs text-white/40 py-2">Loading older messages...</div>}

        {activeMessages.length === 0 ? (
          <div className="text-white/40 text-center py-6">No messages yet</div>
        ) : (
          activeMessages.map((msg) => (
            <MessageBubble
              key={msg._id || msg.tempId}
              message={msg}
              currentUserId={senderId}
            />
          ))
        )}
      </div>

      {/* Input area (kept exactly like your original) */}
      <div className="flex items-end gap-3 p-3 border-t border-white/10 bg-transparent">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleEnterPress}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-2xl bg-white/6 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-white/10 transition"
          rows={1}
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-4 py-2 rounded-2xl bg-white text-[#1d365e] font-semibold shadow hover:scale-105 transition disabled:opacity-60"
          aria-label="Send message"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
