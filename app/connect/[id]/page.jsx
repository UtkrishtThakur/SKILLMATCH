"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ConnectPage({ params }) {
  const [activeTab, setActiveTab] = useState("received");
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safe localStorage access
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // The app stores the full user object under the key "user" (JSON).
      // Older/incorrect code looked for "userId" which doesn't exist — causing no fetch.
      const storedUserJson = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUserJson) {
        try {
          const userObj = JSON.parse(storedUserJson);
          // user id can be _id or id depending on where it came from
          const idFromStorage = userObj && (userObj._id || userObj.id || null);
          setUserId(idFromStorage);
        } catch (e) {
          // fallback: if parsing fails, ignore and continue
          console.error("Failed to parse stored user:", e);
        }
      }

      // Always set token if present
      setToken(storedToken || null);

      // As a fallback (e.g., first load), use the route param id so the page can still fetch
      if (!storedUserJson && params && params.id) {
        setUserId(params.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // API now returns compact summaries: received: [{ requestId, from, ... }]
          setReceivedRequests((data.received || []).map(r => ({
            _id: r.requestId,
            from: r.from,
            status: r.status,
            createdAt: r.createdAt,
          })));

          setSentRequests((data.sent || []).map(r => ({
            _id: r.requestId,
            to: r.to,
            status: r.status,
            createdAt: r.createdAt,
          })));

          setConnections((data.connections || []).map(c => ({
            connectDocId: c.connectDocId,
            user: c.user,
            connectedAt: c.connectedAt,
          })));
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

      toast.success(data.message || 'Action successful');

      // Re-fetch the latest lists from server for consistency
      // (avoids client-state drift and simplifies handling)
      setLoading(true);
      try {
        const refetch = await fetch(`/api/connect/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        const fresh = await refetch.json();
        if (refetch.ok) {
          setReceivedRequests((fresh.received || []).map(r => ({ _id: r.requestId, from: r.from, status: r.status, createdAt: r.createdAt })));
          setSentRequests((fresh.sent || []).map(r => ({ _id: r.requestId, to: r.to, status: r.status, createdAt: r.createdAt })));
          setConnections((fresh.connections || []).map(c => ({ connectDocId: c.connectDocId, user: c.user, connectedAt: c.connectedAt })));
        }
      } catch (e) {
        console.error('Refetch after action failed', e);
      } finally {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const renderCard = (req, type) => {
    const user = type === "received" ? req.from : type === "sent" ? req.to : req.user;
    const title = type === "received" ? `${user.name} sent you a request` : type === "sent" ? `Request to ${user.name}` : user.name;

    return (
      <div
        key={type === 'connections' ? req.connectDocId : req._id}
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
          <p className="text-sm text-gray-300 truncate">{(user.skills || []).join(", ")}</p>
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
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
        <p className="animate-pulse text-lg font-medium">Loading your connections...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-3xl font-bold text-center mb-8 tracking-wide">Your Connections</h1>

        {/* Tabs */}
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
              {tab === "received" ? "Received Requests" : tab === "sent" ? "Sent Requests" : "Connections"}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="grid sm:grid-cols-2 gap-6">
          {activeTab === "received" &&
            (receivedRequests.length > 0
              ? receivedRequests.map((req) => renderCard(req, "received"))
              : <p className="text-center text-gray-400 col-span-2">No received requests</p>)}

          {activeTab === "sent" &&
            (sentRequests.length > 0
              ? sentRequests.map((req) => renderCard(req, "sent"))
              : <p className="text-center text-gray-400 col-span-2">No sent requests</p>)}

          {activeTab === "connections" &&
            (connections.length > 0
              ? connections.map((conn) => renderCard(conn, "connection"))
              : <p className="text-center text-gray-400 col-span-2">No connections yet</p>)}
        </div>
      </div>
    </div>
  );
}
