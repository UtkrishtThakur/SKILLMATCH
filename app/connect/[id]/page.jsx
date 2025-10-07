"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState("received");
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Fetch connection data from backend
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return alert("You must be logged in.");

        const res = await fetch("/api/connect", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
          // The API returns populated senderId/receiverId docs for pending items
          setReceivedRequests((data.received || []).map((r) => ({ _id: r._id, name: r.senderId.name, profilePhoto: r.senderId.profilePhoto, skills: r.senderId.skills, description: r.senderId.description, requestDocId: r._id, requestDoc: r })));
          setSentRequests((data.sent || []).map((r) => ({ _id: r._id, name: r.receiverId.name, profilePhoto: r.receiverId.profilePhoto, skills: r.receiverId.skills, description: r.receiverId.description, requestDocId: r._id, requestDoc: r })));
        } else {
          console.error("Error fetching connections:", data.error);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const handleAccept = async (id) => {
    // id is the requestDocId
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("You must be logged in.");
      const body = { action: "accept", requestId: id };
      const res = await fetch(`/api/connect/${localStorage.getItem("userId")}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        // remove from received and optionally add to connections UI
        setReceivedRequests((prev) => prev.filter((r) => r.requestDocId !== id));
        alert("Request accepted");
      } else {
        alert(data.error || "Could not accept request");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleDecline = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("You must be logged in.");
      const body = { action: "decline", requestId: id };
      const res = await fetch(`/api/connect/${localStorage.getItem("userId")}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setReceivedRequests((prev) => prev.filter((r) => r.requestDocId !== id));
        alert("Request declined");
      } else {
        alert(data.error || "Could not decline request");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleCancel = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("You must be logged in.");
      const body = { action: "cancel", requestId: id };
      const res = await fetch(`/api/connect/${localStorage.getItem("userId")}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setSentRequests((prev) => prev.filter((r) => r.requestDocId !== id));
        alert("Request canceled");
      } else {
        alert(data.error || "Could not cancel request");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
        <p>Loading connections...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-4xl mx-auto mt-8">
        <h1 className="text-3xl font-bold text-center mb-6">Your Connections</h1>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("received")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "received"
                ? "bg-indigo-500 text-white shadow-lg scale-105"
                : "bg-blue-800 text-gray-300 hover:bg-blue-700"
            }`}
          >
            Received Requests
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === "sent"
                ? "bg-indigo-500 text-white shadow-lg scale-105"
                : "bg-blue-800 text-gray-300 hover:bg-blue-700"
            }`}
          >
            Sent Requests
          </button>
        </div>

        {/* Requests List */}
        <div className="grid sm:grid-cols-2 gap-6">
          {activeTab === "received" &&
            (receivedRequests.length > 0 ? (
              receivedRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-blue-900/40 border border-blue-700 rounded-2xl p-4 flex items-center gap-4 hover:bg-blue-900/60 transition"
                >
                  <Image
                    src={req.profilePhoto || "/default-avatar.png"}
                    alt={req.name}
                    width={60}
                    height={60}
                    className="rounded-full border border-blue-500"
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{req.name}</h2>
                    <p className="text-sm text-gray-300">
                      {(req.skills || []).join(", ")}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => handleAccept(req._id)}
                        className="bg-green-500 px-3 py-1 rounded-md text-sm hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(req._id)}
                        className="bg-red-500 px-3 py-1 rounded-md text-sm hover:bg-red-600"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 col-span-2">
                No received requests
              </p>
            ))}

          {activeTab === "sent" &&
            (sentRequests.length > 0 ? (
              sentRequests.map((req) => (
                <div
                  key={req._id}
                  className="bg-blue-900/40 border border-blue-700 rounded-2xl p-4 flex items-center gap-4 hover:bg-blue-900/60 transition"
                >
                  <Image
                    src={req.profilePhoto || "/default-avatar.png"}
                    alt={req.name}
                    width={60}
                    height={60}
                    className="rounded-full border border-blue-500"
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">{req.name}</h2>
                    <p className="text-sm text-gray-300">
                      {(req.skills || []).join(", ")}
                    </p>
                    <p className="text-sm text-yellow-400 mt-1">Pending...</p>
                    <button
                      onClick={() => handleCancel(req._id)}
                      className="bg-red-500 px-3 py-1 mt-2 rounded-md text-sm hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 col-span-2">
                No sent requests
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
