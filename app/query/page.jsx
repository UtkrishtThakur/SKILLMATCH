"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import QueryCard from "@/components/QueryCard";

export default function QueryPage() {
    const [activeTab, setActiveTab] = useState("feed");
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [skillsInput, setSkillsInput] = useState("");

    const router = useRouter();

    useEffect(() => {
        fetchQueries();
    }, [activeTab]);

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`/api/query?view=${activeTab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setQueries(data.queries || []);
            } else {
                toast.error(data.error || "Failed to fetch queries");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handlePostQuery = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const skills = skillsInput.split(",").map(s => s.trim()).filter(s => s);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/query", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title, description, skills }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Query posted!");
                setShowModal(false);
                setTitle("");
                setDescription("");
                setSkillsInput("");
                if (activeTab === "my-queries") fetchQueries();
                else setActiveTab("my-queries");
            } else {
                toast.error(data.error || "Failed to post query");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-12 px-4 md:px-8">
            {/* Aurora Background */}
            <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                            Skill <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Queries</span>
                        </h1>
                        <p className="text-slate-400">Ask the community, share your knowledge.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        + Post a Query
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
                    {["feed", "my-queries", "solved"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab
                                    ? "bg-white/10 text-white"
                                    : "text-slate-500 hover:text-slate-300"
                                }`}
                        >
                            {tab === "feed" ? "For You" : tab === "my-queries" ? "My Queries" : "My Solutions"}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-48 rounded-2xl bg-white/5 animate-pulse"></div>
                        ))}
                    </div>
                ) : queries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {queries.map((query) => (
                            <QueryCard key={query._id} query={query} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-50">
                        <p className="text-xl font-medium">No queries found here.</p>
                    </div>
                )}
            </div>

            {/* Post Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg p-6 md:p-8 animate-enter">
                        <h2 className="text-2xl font-bold mb-6">Ask a Question</h2>
                        <form onSubmit={handlePostQuery} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., How do I implement Auth.js?"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Explain your problem..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Required Skills (comma separated)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., React, Next.js, Auth"
                                    value={skillsInput}
                                    onChange={(e) => setSkillsInput(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Posting..." : "Post Query"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
