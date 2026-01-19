"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import { toast } from "react-hot-toast";
import MessageBubble from "./MessageBubble";
import {
  fetchMessagesAction,
  sendMessageAction,
} from "@/app/actions/actions";

export default function ChatBox({
  conversationId,
  senderId,
  onMessageSent,
  messages: propMessages = null,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // internal messages if parent does not control
  const [internalMessages, setInternalMessages] = useState([]);

  const optimisticIds = useRef(new Set());
  const textareaRef = useRef(null);
  const msgsRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const messagesLengthRef = useRef(0);

  /* =========================
     AUTO EXPAND TEXTAREA
  ========================= */

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [message]);

  const activeMessages = propMessages || internalMessages;

  /* =========================
     SCROLL MANAGEMENT
  ========================= */

  useLayoutEffect(() => {
    const el = msgsRef.current;
    if (!el) return;

    const newLength = activeMessages.length;
    const oldLength = messagesLengthRef.current;
    const addedCount = newLength - oldLength;

    if (addedCount > 0 && loadingMore) {
      const diff = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop += diff;
      setLoadingMore(false);
    } else if (newLength > oldLength || newLength === 0) {
      el.scrollTop = el.scrollHeight;
    }

    messagesLengthRef.current = newLength;
    prevScrollHeightRef.current = el.scrollHeight;
  }, [activeMessages, loadingMore]);

  /* =========================
     FETCH MESSAGES (PAGINATION)
  ========================= */

  const fetchMessages = useCallback(
    async (beforeDate = null) => {
      if (!conversationId) return;

      const res = await fetchMessagesAction(conversationId, {
        before: beforeDate,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to load messages");
        return;
      }

      const fetched = res.data.messages || [];

      if (fetched.length < 20) setHasMore(false);

      setInternalMessages((prev) =>
        beforeDate ? [...fetched, ...prev] : fetched
      );
    },
    [conversationId]
  );

  const handleScroll = () => {
    const el = msgsRef.current;
    if (!el) return;

    if (el.scrollTop === 0 && hasMore && !loadingMore && activeMessages.length) {
      setLoadingMore(true);
      prevScrollHeightRef.current = el.scrollHeight;
      fetchMessages(activeMessages[0].createdAt);
    }
  };

  /* =========================
     MERGE MESSAGE (OPTIMISTIC)
  ========================= */

  const pushOrReplaceMessage = (msg) => {
    if (propMessages) {
      onMessageSent?.(msg);
      return;
    }

    setInternalMessages((prev) => {
      if (msg.tempId) {
        const idx = prev.findIndex(
          (m) => m.tempId === msg.tempId || m._id === msg.tempId
        );
        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...msg };
          return copy;
        }
      }

      if (msg._id && prev.some((m) => m._id === msg._id)) {
        return prev.map((m) =>
          m._id === msg._id ? { ...m, ...msg } : m
        );
      }

      return [...prev, msg];
    });

    onMessageSent?.(msg);
  };

  /* =========================
     SEND MESSAGE (SERVER ACTION)
  ========================= */

  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;

    setSending(true);
    const tempId = `tmp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const storedUser =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("user") || "null")
        : null;

    const optimistic = {
      _id: tempId,
      tempId,
      conversationId,
      content: message,
      createdAt: new Date().toISOString(),
      sender: {
        _id: senderId || storedUser?._id || storedUser?.id,
        name: storedUser?.name,
        profilePhoto: storedUser?.profilePhoto,
      },
      optimistic: true,
    };

    optimisticIds.current.add(tempId);
    pushOrReplaceMessage(optimistic);
    setMessage("");

    const res = await sendMessageAction(conversationId, message, tempId);

    if (!res.success) {
      toast.error(res.error || "Failed to send message");
      pushOrReplaceMessage({ _id: tempId, failed: true, tempId });
    } else {
      optimisticIds.current.delete(tempId);
      const canonical = res.data?.message || res.data;
      if (canonical) {
        pushOrReplaceMessage({ ...canonical, tempId });
      }
    }

    setSending(false);
  };

  const handleEnterPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* =========================
     UI — UNCHANGED
  ========================= */

  return (
    <div className="flex flex-col gap-2 w-full max-w-full">
      <div
        ref={msgsRef}
        onScroll={handleScroll}
        className="w-full overflow-y-auto p-3 space-y-3 rounded-xl bg-transparent scroll-smooth"
        style={{
          maxHeight: "calc(100vh - 350px)",
          minHeight: "300px",
        }}
      >
        {loadingMore && (
          <div className="text-center text-xs text-white/40 py-2">
            Loading older messages...
          </div>
        )}

        {activeMessages.length === 0 ? (
          <div className="text-white/40 text-center py-6">
            No messages yet
          </div>
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

      <div className="flex items-end gap-3 p-3 border-t border-white/10 bg-transparent">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleEnterPress}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-2xl bg-white/6 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-white/10 transition"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-4 py-2 rounded-2xl bg-white text-[#1d365e] font-semibold shadow hover:scale-105 transition disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
