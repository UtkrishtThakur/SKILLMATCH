"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ConnectPage({ params }) {
  const [activeTab, setActiveTab] = useState("received");
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    setAnimate(true);
  }, []);

  // ✅ Load and persist user/token properly for independent access later
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

        // Keep a compact copy for other flows that might rely on it
        localStorage.setItem(
          "skillmatch_user",
          JSON.stringify({
            _id: idFromStorage,
            name: userObj.name,
            email: userObj.email,
            profilePhoto: userObj.profilePhoto,
          })
        );
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    } else if (params && params.id) {
      setUserId(params.id);
    }
  }, [params]);

  // ✅ Fetch connections after we have user + token
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

  // ✅ Safe reusable action handler
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

      // Refetch latest lists
      const refetch = await fetch(`/api/connect/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fresh = await refetch.json();
      if (refetch.ok) {
        setReceivedRequests(
          (fresh.received || []).map((r) => ({
            _id: r.requestId,
            from: r.from,
            status: r.status,
            createdAt: r.createdAt,
          }))
        );
        setSentRequests(
          (fresh.sent || []).map((r) => ({
            _id: r.requestId,
            to: r.to,
            status: r.status,
            createdAt: r.createdAt,
          }))
        );
        setConnections(
          (fresh.connections || []).map((c) => ({
            connectDocId: c.connectDocId,
            user: c.user,
            connectedAt: c.connectedAt,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const renderCard = (req, type) => {
    const user =
      type === "received"
        ? req.from
        : type === "sent"
        ? req.to
        : req.user;

    if (!user) {
      return (
        <div
          key={req._id || req.connectDocId}
          className="bg-[#1d365e] rounded-2xl p-4 border border-white/20 shadow-md"
        >
          <p className="text-sm text-white/70">
            User data missing for this connection.
          </p>
        </div>
      );
    }

    const title =
      type === "received"
        ? `${user.name} sent you a request`
        : type === "sent"
        ? `Request to ${user.name}`
        : user.name;

    return (
      <div
        key={type === "connections" ? req.connectDocId : req._id}
        className="bg-[#1d365e] border border-white/20 rounded-2xl p-5 flex items-center gap-5 hover:shadow-white/30 transition-shadow duration-200 shadow-md hover:scale-[1.03] transform"
        tabIndex={0}
        aria-label={`Profile card for ${user.name}`}
      >
        <Image
          src={user.profilePhoto || "/default-avatar.png"}
          alt={user.name}
          width={64}
          height={64}
          className="rounded-full border border-white shadow-sm object-cover"
        />
        <div className="flex-1 text-white">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          <p className="text-sm text-white/70 truncate">{(user.skills || []).join(", ")}</p>
          <p className="text-xs text-white/50 mt-1">{user.email}</p>

          {type === "received" && (
            <div className="flex gap-4 mt-3">
              <button
                onClick={() => handleAction("accept", req._id)}
                className="bg-white text-[#1d365e] px-4 py-1 rounded-md text-sm font-semibold hover:bg-white/90 transition"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction("decline", req._id)}
                className="bg-red-600 px-4 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition"
              >
                Decline
              </button>
            </div>
          )}

          {type === "sent" && (
            <div className="flex flex-col mt-3">
              <p className="text-yellow-400 font-medium text-sm">Pending...</p>
              <button
                onClick={() => handleAction("cancel", req._id)}
                className="bg-red-600 mt-2 px-4 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition"
              >
                Cancel
              </button>
            </div>
          )}

          {type === "connection" && (
            <div className="flex gap-4 mt-3">
              <button
                onClick={() => handleAction("remove", req.connectDocId)}
                className="bg-red-600 px-4 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition"
              >
                Remove
              </button>
              <ChatButton userId={user._id} userName={user.name} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="animate-pulse text-[#1d365e] text-lg font-semibold">Loading your connections...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-white pt-[6.5rem] pb-14 px-6 flex justify-center items-start">
      {/* Decorative blurred blobs (keeps login-style feel) */}
      <svg
        aria-hidden="true"
        className="absolute -z-10 top-6 left-6 w-[360px] h-[360px] opacity-10 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#g1)" />
      </svg>

      <svg
        aria-hidden="true"
        className="absolute -z-10 bottom-6 right-6 w-[360px] h-[360px] opacity-08 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="g2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#g2)" />
      </svg>

      {/* Bigger centered card to match other pages */}
      <div
        className={`max-w-5xl w-full bg-[#1d365e] rounded-3xl p-10 shadow-2xl border border-white/30 transition-all duration-400 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        style={{ marginTop: "1.25rem" }}
      >
        <h1 className="text-3xl font-bold text-white text-center mb-6 tracking-wide select-text">
          Your Connections
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-6 mb-8">
          {["received", "sent", "connections"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-white text-sm font-semibold uppercase tracking-wide transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-[#1d365e] shadow-lg scale-105"
                  : "bg-[#17406b] hover:bg-[#162f4f]"
              }`}
              aria-pressed={activeTab === tab}
            >
              {tab === "received"
                ? "Received Requests"
                : tab === "sent"
                ? "Sent Requests"
                : "Connections"}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="grid sm:grid-cols-2 gap-6 overflow-y-auto" style={{ maxHeight: "620px" }}>
          {activeTab === "received" &&
            (receivedRequests.length > 0 ? (
              receivedRequests.map((req) => renderCard(req, "received"))
            ) : (
              <p className="text-center text-white/70 col-span-2 select-text">No received requests</p>
            ))}

          {activeTab === "sent" &&
            (sentRequests.length > 0 ? (
              sentRequests.map((req) => renderCard(req, "sent"))
            ) : (
              <p className="text-center text-white/70 col-span-2 select-text">No sent requests</p>
            ))}

          {activeTab === "connections" &&
            (connections.length > 0 ? (
              connections.map((conn) => renderCard(conn, "connection"))
            ) : (
              <p className="text-center text-white/70 col-span-2 select-text">No connections yet</p>
            ))}
        </div>
      </div>

      <style jsx>{`
        .blur-3xl {
          filter: blur(28px);
        }
        @media (min-width: 768px) {
          div[style] {
            margin-top: 1.5rem;
          }
        }
        @media (max-width: 520px) {
          .max-w-5xl { padding: 1rem; border-radius: 1rem; }
        }
      `}</style>
    </div>
  );
}

function ChatButton({ userId, userName }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Loading overlay + animation before open chat
  const handleChat = async () => {
    setLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

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
        console.error("Conversation create failed", data);
        toast?.error?.(data?.error || "Failed to open chat");
        setLoading(false);
        return;
      }

      const conv =
        (data.conversation && data.conversation._id) ||
        data.conversationId ||
        (data.conversationId && data.conversationId._id);

      if (conv) {
        localStorage.setItem("last_conversation_id", conv);

        // Small delay so user sees the loading animation before navigation
        setTimeout(() => {
          router.push(`/chat/${conv}`);
        }, 600);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleChat}
        disabled={loading}
        className="bg-white text-[#1d365e] px-4 py-1 rounded-md text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-60"
        aria-label={`Open chat with ${userName}`}
      >
        {loading ? "Opening..." : "Chat"}
      </button>

      {loading && (
        // Fullscreen loading overlay to indicate chat opening (does not change existing flow)
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="bg-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-lg">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <p className="text-white font-medium">Opening chat with {userName}...</p>
          </div>
        </div>
      )}
    </>
  );
}