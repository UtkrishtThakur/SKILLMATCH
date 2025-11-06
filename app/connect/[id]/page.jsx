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

  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

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

        // 🔹 Ensure SkillMatch uses consistent user key for direct chat load
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
          className="bg-gray-800 rounded-2xl p-4"
        >
          <p className="text-sm text-gray-300">
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
        className="bg-blue-900/40 border border-blue-700 rounded-2xl p-4 flex items-center gap-4 hover:bg-blue-900/60 transition-all duration-200 shadow-md hover:shadow-xl"
      >
        <Image
          src={user.profilePhoto || "/default-avatar.png"}
          alt={user.name}
          width={60}
          height={60}
          className="rounded-full border border-blue-500"
        />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-300 truncate">
            {(user.skills || []).join(", ")}
          </p>
          <p className="text-xs text-gray-400 mt-1">{user.email}</p>

          {type === "received" && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => handleAction("accept", req._id)}
                className="bg-green-500 px-3 py-1 rounded-md text-sm hover:bg-green-600 transition"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction("decline", req._id)}
                className="bg-red-500 px-3 py-1 rounded-md text-sm hover:bg-red-600 transition"
              >
                Decline
              </button>
            </div>
          )}

          {type === "sent" && (
            <div className="flex flex-col mt-2">
              <p className="text-sm text-yellow-400 font-medium">Pending...</p>
              <button
                onClick={() => handleAction("cancel", req._id)}
                className="bg-red-500 px-3 py-1 rounded-md text-sm hover:bg-red-600 transition mt-1"
              >
                Cancel
              </button>
            </div>
          )}

          {type === "connection" && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => handleAction("remove", req.connectDocId)}
                className="bg-red-500 px-3 py-1 rounded-md text-sm hover:bg-red-600 transition"
              >
                Remove
              </button>
              <ChatButton userId={user._id} />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
        <p className="animate-pulse text-lg font-medium">
          Loading your connections...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-3xl font-bold text-center mb-8 tracking-wide">
          Your Connections
        </h1>

        <div className="flex justify-center gap-4 mb-8">
          {["received", "sent", "connections"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "bg-indigo-500 text-white shadow-lg scale-105"
                  : "bg-blue-800 text-gray-300 hover:bg-blue-700"
              }`}
            >
              {tab === "received"
                ? "Received Requests"
                : tab === "sent"
                ? "Sent Requests"
                : "Connections"}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {activeTab === "received" &&
            (receivedRequests.length > 0 ? (
              receivedRequests.map((req) => renderCard(req, "received"))
            ) : (
              <p className="text-center text-gray-400 col-span-2">
                No received requests
              </p>
            ))}

          {activeTab === "sent" &&
            (sentRequests.length > 0 ? (
              sentRequests.map((req) => renderCard(req, "sent"))
            ) : (
              <p className="text-center text-gray-400 col-span-2">
                No sent requests
              </p>
            ))}

          {activeTab === "connections" &&
            (connections.length > 0 ? (
              connections.map((conn) => renderCard(conn, "connection"))
            ) : (
              <p className="text-center text-gray-400 col-span-2">
                No connections yet
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}

function ChatButton({ userId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
        return;
      }

      const conv =
        data.conversation?._id ||
        data.conversationId ||
        data.conversationId?._id;
      if (conv) {
        // ✅ Also persist last conversation for direct chat reloads
        localStorage.setItem("last_conversation_id", conv);
        router.push(`/chat/${conv}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="bg-indigo-500 px-3 py-1 rounded-md text-sm hover:bg-indigo-600 transition"
    >
      {loading ? "Opening..." : "Chat"}
    </button>
  );
}
