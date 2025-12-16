"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function ConnectPage({ params }) {
  const [activeTab, setActiveTab] = useState("received");
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setAnimate(true);
  }, []);

  // 1. Initialize User & Token
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUserJson = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUserJson) {
      try {
        const userObj = JSON.parse(storedUserJson);
        const idFromStorage = userObj && (userObj._id || userObj.id || null);
        setUserId(idFromStorage);
        setToken(storedToken || null);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    } else if (params && params.id) {
      setUserId(params.id);
    }
  }, [params]);

  // 2. Fetch Data
  useEffect(() => {
    if (!userId || !token) return;

    const fetchConnections = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/connect/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setReceivedRequests(
            (data.received || []).map((r) => ({
              _id: r.requestId,
              from: r.from,
              status: r.status,
              createdAt: r.createdAt,
            }))
          );
          setSentRequests(
            (data.sent || []).map((r) => ({
              _id: r.requestId,
              to: r.to,
              status: r.status,
              createdAt: r.createdAt,
            }))
          );
          setConnections(
            (data.connections || []).map((c) => ({
              connectDocId: c.connectDocId,
              user: c.user,
              connectedAt: c.connectedAt,
            }))
          );
        } else {
          toast.error(data.error || "Failed to fetch connections.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error while fetching connections.");
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [userId, token]);

  // 3. Action Handler
  const handleAction = async (action, requestId) => {
    if (!userId || !token) return toast.error("Not authenticated");

    try {
      const res = await fetch(`/api/connect/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, requestId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Action failed");
        return;
      }

      toast.success(data.message || "Action successful");

      // Refetch
      const refetch = await fetch(`/api/connect/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fresh = await refetch.json();
      if (refetch.ok) {
        setReceivedRequests(fresh.received || []);
        setSentRequests(fresh.sent || []);
        setConnections(fresh.connections || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const renderCard = (req, type) => {
    // Determine the user object to display
    let displayUser = null;
    let title = "";

    if (type === "received") {
      displayUser = req.from;
      title = `${displayUser?.name} sent you a request`;
    } else if (type === "sent") {
      displayUser = req.to;
      title = `Request to ${displayUser?.name}`;
    } else {
      displayUser = req.user;
      title = displayUser?.name;
    }

    if (!displayUser) return null;

    return (
      <div
        key={req._id || req.connectDocId}
        className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
      >
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative z-10 flex items-start gap-4">
          <Image
            src={displayUser.profilePhoto || "/default-avatar.png"}
            alt={displayUser.name}
            width={64}
            height={64}
            className="rounded-2xl object-cover border-2 border-white/10 shadow-lg"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate mb-1">{displayUser.name}</h3>
            <p className="text-violet-300 text-xs font-medium uppercase tracking-wider mb-2">
              {displayUser.role || "Developer"}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {(displayUser.skills || []).slice(0, 3).map((skill, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-slate-300 border border-white/5">
                  {skill}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {type === "received" && (
                <>
                  <button
                    onClick={() => handleAction("accept", req._id)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleAction("decline", req._id)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}

              {type === "sent" && (
                <button
                  onClick={() => handleAction("cancel", req._id)}
                  className="px-4 py-2 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 rounded-xl text-sm font-medium transition-colors border border-white/5 hover:border-red-500/30"
                >
                  Cancel Request
                </button>
              )}

              {type === "connection" && (
                <>
                  <ChatButton userId={displayUser._id} userName={displayUser.name} />
                  <button
                    onClick={() => handleAction("remove", req.connectDocId)}
                    className="px-3 py-2 text-slate-500 hover:text-red-400 text-xs font-medium transition-colors"
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

  if (loading)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full font-semibold"></div>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden selection:bg-emerald-500/30">

      {/* Background Aurora */}
      <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className={`mb-12 text-center transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Network.</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Manage your requests and connections. Build your squad one connection at a time.
          </p>
        </div>

        {/* Tabs */}
        <div className={`flex flex-wrap justify-center gap-2 mb-12 transition-all duration-700 delay-100 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {["received", "sent", "connections"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 border ${activeTab === tab
                  ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  : "bg-transparent text-slate-400 border-white/10 hover:border-white/30 hover:text-white"
                }`}
            >
              {tab === "received" ? "Received" : tab === "sent" ? "Sent" : "Connections"}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {activeTab === "received" &&
            (receivedRequests.length > 0 ? (
              receivedRequests.map((req) => renderCard(req, "received"))
            ) : (
              <EmptyState message="No pending requests." />
            ))}

          {activeTab === "sent" &&
            (sentRequests.length > 0 ? (
              sentRequests.map((req) => renderCard(req, "sent"))
            ) : (
              <EmptyState message="You haven't sent any requests." />
            ))}

          {activeTab === "connections" &&
            (connections.length > 0 ? (
              connections.map((conn) => renderCard(conn, "connection"))
            ) : (
              <EmptyState message="No connections yet. Go search for people!" />
            ))}
        </div>

      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <span className="text-2xl">👻</span>
      </div>
      <p className="text-slate-400 font-medium">{message}</p>
    </div>
  )
}

function ChatButton({ userId, userName }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId: userId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to open chat");
        setLoading(false);
        return;
      }

      const conv = (data.conversation && data.conversation._id) || data.conversationId;
      if (conv) router.push(`/chat/${conv}`);
      else setLoading(false);

    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
    >
      {loading ? "..." : "Chat Connect"}
    </button>
  );
}