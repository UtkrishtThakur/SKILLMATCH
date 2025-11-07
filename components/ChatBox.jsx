'use client';

import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";

/**
 * ChatBox
 * - Keeps your original send logic/UI intact.
 * - Adds an internal (or prop-driven) messages list area ABOVE the input.
 * - That messages area is the only thing that scrolls (overflow-y-auto).
 *
 * Props:
 * - conversationId, senderId, token (same as before)
 * - onMessageSent(msg) same as before (optimistic + server updates)
 * - messages (optional): if you already manage messages in a parent, pass them here;
 *   otherwise the component will render its internal messages array (optimistic messages).
 */

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

  // internal messages only used if parent doesn't pass messages
  const [internalMessages, setInternalMessages] = useState([]);

  // set to track optimistic IDs
  const optimisticIds = useRef(new Set());
  const textareaRef = useRef(null);

  // scrollable messages container ref
  const msgsRef = useRef(null);

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

  // Auto-scroll to bottom when messages change.
  // If parent passes messages, scroll on propMessages change; else internalMessages.
  useEffect(() => {
    const el = msgsRef.current;
    if (!el) return;
    // always scroll to bottom for simplicity (can add "if near bottom" later)
    el.scrollTop = el.scrollHeight;
  }, [propMessages, internalMessages]);

  // helper to get active messages array to render
  const activeMessages = propMessages || internalMessages;

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
        _id: senderId || storedUser?._id || storedUser?.id || null,
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

  // UI: the only big change is the addition of a scrollable messages pane (msgsRef)
  return (
    <div className="flex flex-col gap-2 w-full max-w-full">
      {/* Messages pane - this is the ONLY thing that scrolls */}
      <div
        ref={msgsRef}
        className="w-full overflow-y-auto p-3 space-y-3 rounded-xl bg-transparent"
        style={{
          // tweak this maxHeight to fit your layout. It keeps the pane from growing indefinitely.
          // If you want it smaller, reduce 60vh -> 50vh etc.
          maxHeight: "60vh",
        }}
        aria-live="polite"
      >
        {activeMessages.length === 0 ? (
          <div className="text-white/40 text-center py-6">No messages yet</div>
        ) : (
          activeMessages.map((msg) => {
            const isMe = msg.sender?._id === senderId;
            return (
              <div key={msg._id || msg.tempId} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl break-words ${
                    isMe ? "bg-white text-[#1d365e]" : "bg-white/10 text-white"
                  } ${msg.failed ? "opacity-60" : ""}`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
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
