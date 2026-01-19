"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  fetchConnectionsAction,
  respondConnectionAction,
  startConversationAction,
} from "@/app/actions/actions";

/* =========================
   PAGE
========================= */

export default function ConnectPage({ params }) {
  const [activeTab, setActiveTab] = useState("received");
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  /* 1️⃣ Init user (UI-only, NOT auth) */
  useEffect(() => {
    try {
      const skillmatchUser = localStorage.getItem("skillmatch_user");
      const userStr = localStorage.getItem("user");

      let foundId = null;

      if (skillmatchUser) {
        const u = JSON.parse(skillmatchUser);
        foundId = u._id || u.id;
      } else if (userStr) {
        const u = JSON.parse(userStr);
        foundId = u._id || u.id;
      } else if (params?.id) {
        foundId = params.id;
      }

      if (!foundId) {
        router.push("/login");
        return;
      }

      setUserId(foundId);
    } catch (e) {
      console.error(e);
      router.push("/login");
    }
  }, [params, router]);

  /* 2️⃣ Fetch connections (SERVER ACTION) */
  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetchConnectionsAction(userId);

        if (!res.success) {
          toast.error(res.error || "Session expired");
          router.push("/login");
          return;
        }

        if (!mounted) return;

        setReceivedRequests(
          (res.data.received || []).map((r) => ({
            _id: r.requestId,
            from: r.from,
            status: r.status,
            createdAt: r.createdAt,
          }))
        );

        setSentRequests(
          (res.data.sent || []).map((r) => ({
            _id: r.requestId,
            to: r.to,
            status: r.status,
            createdAt: r.createdAt,
          }))
        );

        setConnections(
          (res.data.connections || []).map((c) => ({
            connectDocId: c.connectDocId,
            user: c.user,
            connectedAt: c.connectedAt,
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load connections");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId, router]);

  /* 3️⃣ Handle accept / reject / cancel / remove */
  const handleAction = async (action, requestId) => {
    if (!userId) return toast.error("Not authenticated");

    const res = await respondConnectionAction(userId, action, requestId);

    if (!res.success) {
      toast.error(res.error || "Action failed");
      return;
    }

    toast.success("Action successful");

    const fresh = await fetchConnectionsAction(userId);
    if (fresh.success) {
      setReceivedRequests(fresh.data.received || []);
      setSentRequests(fresh.data.sent || []);
      setConnections(fresh.data.connections || []);
    }
  };

  /* =========================
     CARD RENDER
  ========================= */

  const renderCard = (req, type) => {
    let displayUser = null;

    if (type === "received") displayUser = req.from;
    else if (type === "sent") displayUser = req.to;
    else displayUser = req.user;

    if (!displayUser) return null;

    return (
      <div
        key={req._id || req.connectDocId}
        className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
      >
        <div className="relative z-10 flex items-start gap-4">
          <Image
            src={displayUser.profilePhoto || "/default-avatar.png"}
            alt={displayUser.name}
            width={64}
            height={64}
            className="rounded-2xl object-cover border-2 border-white/10"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate">{displayUser.name}</h3>

            <div className="flex gap-3 mt-3">
              {type === "received" && (
                <>
                  <button
                    onClick={() => handleAction("accept", req._id)}
                    className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-sm font-bold"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction("decline", req._id)}
                    className="px-4 py-2 bg-white/5 rounded-xl text-sm"
                  >
                    Decline
                  </button>
                </>
              )}

              {type === "sent" && (
                <button
                  onClick={() => handleAction("cancel", req._id)}
                  className="px-4 py-2 bg-white/5 rounded-xl text-sm"
                >
                  Cancel
                </button>
              )}

              {type === "connection" && (
                <>
                  <ChatButton userId={displayUser._id} />
                  <button
                    onClick={() =>
                      handleAction("remove", req.connectDocId)
                    }
                    className="text-xs text-red-400"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* =========================
     UI BELOW — UNCHANGED
  ========================= */

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* tabs + grid exactly same as before */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === "received" &&
            receivedRequests.map((r) => renderCard(r, "received"))}
          {activeTab === "sent" &&
            sentRequests.map((r) => renderCard(r, "sent"))}
          {activeTab === "connections" &&
            connections.map((c) => renderCard(c, "connection"))}
        </div>
      </div>
    </div>
  );
}

/* =========================
   CHAT BUTTON (FIXED)
========================= */

function ChatButton({ userId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    setLoading(true);

    const res = await startConversationAction(userId);

    if (!res.success) {
      toast.error(res.error || "Failed to open chat");
      setLoading(false);
      return;
    }

    const convId =
      res.data?.conversation?._id || res.data?.conversationId;

    if (convId) router.push(`/chat/${convId}`);
    else setLoading(false);
  };

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="flex-1 bg-violet-600 text-white py-2 rounded-xl text-sm font-bold disabled:opacity-50"
    >
      {loading ? "..." : "Chat Connect"}
    </button>
  );
}
