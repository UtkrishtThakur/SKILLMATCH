"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function RequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [connections, setConnections] = useState([]);
    const [interestedRequests, setInterestedRequests] = useState(new Set());
    const [filter, setFilter] = useState({ skill: "", tag: "" });

    // Get current user
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const userStr = localStorage.getItem("user") || localStorage.getItem("skillmatch_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setCurrentUser(user);
                }
            } catch (err) {
                console.error("Failed to parse user:", err);
            }
        }
    }, []);

    // Fetch user's connections
    useEffect(() => {
        if (!currentUser) return;

        const fetchConnections = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await fetch("/api/connect", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const connectedUserIds = new Set();

                    data.received?.forEach(r => {
                        if (r.from?._id) connectedUserIds.add(String(r.from._id));
                    });

                    data.sent?.forEach(s => {
                        if (s.to?._id) connectedUserIds.add(String(s.to._id));
                    });

                    data.connections?.forEach(c => {
                        if (c.user?._id) connectedUserIds.add(String(c.user._id));
                    });

                    setConnections(Array.from(connectedUserIds));
                }
            } catch (err) {
                console.error("Failed to fetch connections:", err);
            }
        };

        fetchConnections();
    }, [currentUser]);

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    // Filter requests
    useEffect(() => {
        if (!currentUser || !currentUser.skills) {
            setFilteredRequests(requests);
            return;
        }

        const userSkills = currentUser.skills.map(s => s.toLowerCase());
        const userId = String(currentUser._id || currentUser.id);

        const filtered = requests.filter(req => {
            const creatorId = String(req.creatorId?._id);

            if (creatorId === userId) return false;
            if (connections.includes(creatorId)) return false;

            const hasMatchingSkill = req.skills.some(reqSkill =>
                userSkills.includes(reqSkill.toLowerCase())
            );

            return hasMatchingSkill;
        });

        setFilteredRequests(filtered);
    }, [requests, currentUser, connections]);

    const fetchRequests = async () => {
        try {
            let url = "/api/requests?";
            if (filter.skill) url += `skill=${encodeURIComponent(filter.skill)}&`;
            if (filter.tag) url += `tag=${encodeURIComponent(filter.tag)}`;

            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                setRequests(data.requests || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleInterest = async (requestId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Please login first");
                router.push("/auth/login");
                return;
            }

            const res = await fetch(`/api/requests/${requestId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("✅ Connection request sent successfully!");
                setInterestedRequests(prev => new Set([...prev, requestId]));
            } else {
                toast.error(data.error || "Failed to send request");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error sending request");
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
            <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black">
                            Opportunities <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Board</span>
                        </h1>
                        <p className="text-slate-400 mt-2">
                            {loading ? "Loading..." : `Showing ${filteredRequests.length} new opportunities matching your skills`}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/requests/create")}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        + Post Request
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-12 text-center">
                        <p className="text-slate-400 text-lg mb-2">No new opportunities found</p>
                        <p className="text-slate-500 text-sm">
                            {currentUser?.skills?.length > 0
                                ? "Check back later for new opportunities, or update your skills to see more"
                                : "Add skills to your profile to see relevant opportunities"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredRequests.map(req => {
                            const hasExpressedInterest = interestedRequests.has(req._id);

                            return (
                                <div key={req._id} className="bg-[#111] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                                    <div className="flex items-start gap-4 mb-4">
                                        <img
                                            src={req.creatorId?.profilePhoto || "/default-avatar.png"}
                                            alt={req.creatorId?.name}
                                            className="w-12 h-12 rounded-full object-cover border border-white/10"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white">{req.creatorId?.name || "Anonymous"}</h3>
                                            <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {req.skills.map((skill, i) => {
                                            const isMatch = currentUser?.skills?.some(
                                                userSkill => userSkill.toLowerCase() === skill.toLowerCase()
                                            );
                                            return (
                                                <span
                                                    key={i}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${isMatch
                                                            ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50'
                                                            : 'bg-violet-500/20 text-violet-300'
                                                        }`}
                                                >
                                                    {skill} {isMatch && '✓'}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    <p className="text-slate-300 text-sm mb-4 line-clamp-3">{req.description}</p>

                                    {req.tags?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {req.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-white/5 text-slate-400 rounded text-xs">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleInterest(req._id)}
                                        disabled={hasExpressedInterest}
                                        className={`w-full py-2 rounded-xl font-bold transition-all ${hasExpressedInterest
                                                ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed border border-emerald-500/50'
                                                : 'bg-white text-black hover:bg-slate-200'
                                            }`}
                                    >
                                        {hasExpressedInterest ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Request Sent
                                            </span>
                                        ) : (
                                            "I'm Interested"
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
