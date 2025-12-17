"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Pusher from "pusher-js";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [animate, setAnimate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  // 1. Initialize Auth State
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedToken = localStorage.getItem("token");

        let foundId = null;
        const skillmatchUserStr = localStorage.getItem("skillmatch_user");
        const userStr = localStorage.getItem("user");

        if (skillmatchUserStr) {
          const sUser = JSON.parse(skillmatchUserStr);
          foundId = sUser._id || sUser.id;
        }

        if (!foundId && userStr) {
          const user = JSON.parse(userStr);
          foundId = user._id || user.id;
        }

        if (storedToken && foundId) {
          setToken(storedToken);
          setCurrentUserId(foundId);
        } else {
          // No auth found, stop loading and redirect
          setLoading(false);
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setLoading(false);
      }
    }
  }, []);

  // 2. Fetch Data ONLY when Auth is Ready
  useEffect(() => {
    if (!token || !currentUserId) return;

    let mounted = true;
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/chat/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Token invalid
            toast.error("Session expired. Please log in.");
          }
          throw new Error("Failed to fetch");
        }

        const data = await res.json();
        if (mounted) {
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load conversations");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchConversations();

    return () => { mounted = false; };
  }, [token, currentUserId]);

  // 3. Realtime Updates for Unread Dots
  useEffect(() => {
    if (!currentUserId) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      encrypted: true
    });

    const channel = pusher.subscribe(`user-${currentUserId}`);

    const handleNewMessage = (data) => {
      // data = { type: 'chat', conversationId, senderId, messageId }
      if (data.type === 'chat' && data.conversationId) {
        setConversations(prev => prev.map(c => {
          if (c._id === data.conversationId) {
            return { ...c, hasUnread: true };
          }
          return c;
        }));
      }
    };

    channel.bind("new-message", handleNewMessage);

    return () => {
      channel.unbind("new-message", handleNewMessage);
      pusher.unsubscribe(`user-${currentUserId}`);
    };
  }, [currentUserId]);

  const handleSelectConversation = (conversationId) => {
    router.push(`/chat/${conversationId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full font-semibold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-8 px-4 md:px-8 relative overflow-hidden selection:bg-fuchsia-500/30">

      {/* Background Aurora */}
      <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

      <div className={`max-w-4xl mx-auto relative z-10 transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black tracking-tight">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Conversations</span>
          </h1>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-slate-400">
            {conversations.length} Active
          </span>
        </div>

        {/* List Container */}
        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[60vh]">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p>No conversations yet. Connect with someone!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {conversations.map((conv) => {
                const otherUser = conv.participants.find((p) => p._id !== currentUserId) || conv.participants[0];

                return (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv._id)}
                    className="group relative p-6 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    {/* Hover Accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <Image
                      src={otherUser?.profilePhoto || "/default-avatar.png"}
                      alt={otherUser?.name || "User"}
                      width={56}
                      height={56}
                      className="rounded-full object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-lg font-bold text-white truncate group-hover:text-fuchsia-200 transition-colors">
                          {otherUser?.name || "Unknown"}
                        </h3>
                        <span className="text-xs text-slate-500 font-mono">
                          {/* Could add time here if available in future */}
                          {/* 2m ago */}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate transition-colors ${conv.hasUnread ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-300'}`}>
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                        {conv.hasUnread && (
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)] ml-2 shrink-0"></span>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-500 group-hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
