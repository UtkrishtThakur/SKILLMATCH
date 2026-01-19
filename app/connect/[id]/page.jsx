"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  fetchConnectionsAction,
  respondConnectionAction,
  startConversationAction,
} from "@/app/actions/actions";

/* ======================================================
   CONNECT PAGE (STABLE + COOKIE AUTH)
====================================================== */

export default function ConnectPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ======================================================
     FETCH CONNECTIONS (AUTH VIA COOKIE ONLY)
  ====================================================== */
  useEffect(() => {
    let alive = true;

    async function loadConnections() {
      setLoading(true);

      const res = await fetchConnectionsAction();

      if (!res.success) {
        toast.error(res.error || "Session expired");
        router.push("/auth/login");
        return;
      }

      if (!alive) return;

      setReceived(res.data.received || []);
      setSent(res.data.sent || []);
      setConnections(res.data.connections || []);
      setLoading(false);
    }

    loadConnections();
    return () => {
      alive = false;
    };
  }, [router]);

  /* ======================================================
     ACTION HANDLER
  ====================================================== */
  const handleAction = async (action, id) => {
    const res = await respondConnectionAction(action, id);

    if (!res.success) {
      toast.error(res.error || "Action failed");
      return;
    }

    toast.success("Updated");

    const fresh = await fetchConnectionsAction();
    if (fresh.success) {
      setReceived(fresh.data.received || []);
      setSent(fresh.data.sent || []);
      setConnections(fresh.data.connections || []);
    }
  };

  /* ======================================================
     CARD
  ====================================================== */
  const Card = ({ user, children }) => {
    const avatar =
      typeof user?.profilePhoto === "string" && user.profilePhoto.trim()
        ? user.profilePhoto
        : "/default-avatar.png";

    return (
      <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
        <div className="flex gap-4">
          <Image
            src={avatar}
            alt={user?.name || "User"}
            width={64}
            height={64}
            className="rounded-2xl object-cover border border-white/10"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate">{user?.name}</h3>
            <div className="mt-4 flex gap-2">{children}</div>
          </div>
        </div>
      </div>
    );
  };

  /* ======================================================
     LOADER
  ====================================================== */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* ======================================================
     UI
  ====================================================== */
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Tabs */}
        <div className="flex gap-2 mb-10">
          {["received", "sent", "connections"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-bold ${activeTab === t
                  ? "bg-white text-black"
                  : "bg-white/5 text-slate-400"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {activeTab === "received" &&
            (received.length ? (
              received.map((r) => (
                <Card key={r._id} user={r.from}>
                  <button
                    onClick={() => handleAction("accept", r._id)}
                    className="flex-1 bg-emerald-500 py-2 rounded-xl font-bold"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction("decline", r._id)}
                    className="px-4 py-2 bg-white/5 rounded-xl"
                  >
                    Decline
                  </button>
                </Card>
              ))
            ) : (
              <Empty text="No received requests" />
            ))}

          {activeTab === "sent" &&
            (sent.length ? (
              sent.map((r) => (
                <Card key={r._id} user={r.to}>
                  <button
                    onClick={() => handleAction("cancel", r._id)}
                    className="px-4 py-2 bg-white/5 rounded-xl"
                  >
                    Cancel
                  </button>
                </Card>
              ))
            ) : (
              <Empty text="No sent requests" />
            ))}

          {activeTab === "connections" &&
            (connections.length ? (
              connections.map((c) => (
                <Card key={c.connectDocId} user={c.user}>
                  <ChatButton userId={c.user._id} />
                  <button
                    onClick={() => handleAction("remove", c.connectDocId)}
                    className="px-3 py-2 text-xs text-red-400"
                  >
                    Remove
                  </button>
                </Card>
              ))
            ) : (
              <Empty text="No connections yet" />
            ))}
        </div>
      </div>
    </div>
  );
}

/* ======================================================
   CHAT BUTTON
====================================================== */

function ChatButton({ userId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    setLoading(true);

    const res = await startConversationAction(userId);

    if (!res.success) {
      toast.error(res.error || "Failed to start chat");
      setLoading(false);
      return;
    }

    const id = res.data?.conversation?._id || res.data?.conversationId;
    if (id) router.push(`/chat/${id}`);
  };

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="flex-1 bg-violet-600 py-2 rounded-xl font-bold disabled:opacity-50"
    >
      Chat
    </button>
  );
}

/* ======================================================
   EMPTY STATE
====================================================== */

function Empty({ text }) {
  return (
    <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">
      {text}
    </div>
  );
}
