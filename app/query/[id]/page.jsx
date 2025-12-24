"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function QueryDetailPage({ params }) {
    const [query, setQuery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answerContent, setAnswerContent] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Need to unwrap params in Next.js 15 if needed, but doing standard access for now
    // However, `params` is a promise in recent next versions, so let's be safe
    const [id, setId] = useState(null);

    useEffect(() => {
        // Handling params based on Next.js version quirks
        if (params && params.id) setId(params.id);
        else if (params && typeof params.then === 'function') {
            params.then(p => setId(p.id));
        } else {
            // fallback
            setId(params?.id);
        }
    }, [params]);

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) setCurrentUser(JSON.parse(user));
    }, []);

    useEffect(() => {
        if (!id) return;
        fetchQuery();
    }, [id]);

    const fetchQuery = async () => {
        try {
            // We can reuse the GET API but we need a single item endpoint. 
            // Wait, the main GET route returns a list. 
            // I should have made a single GET endpoint. 
            // Let's modify the plan: use the feed API but filter? No, inefficient.
            // Actually, let's just make a new simple GET endpoint component in the same file or a new route?
            // I missed implementing a single GET route in the plan.
            // I will implement a fetch directly here using the ID if I can, OR I will add a GET to [id]/answer route?
            // Actually, usually `app/api/query/[id]/route.js` would differ from `answer`.
            // Let's assume I need to fetch it.
            // I'll check if I can filter the main list by ID? No, the main route doesn't support it.
            // I will implement a quick fetch logic in the `app/api/query/[id]/answer`? No that's dirty.
            // I'll create `app/api/query/[id]/route.js` now as well, implicit requirement.

            const token = localStorage.getItem("token");
            const res = await fetch(`/api/query/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setQuery(data.query);
            } else {
                toast.error(data.error || "Failed to load query");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async (e) => {
        e.preventDefault();
        if (!answerContent.trim()) return;
        setSubmitting(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/query/${id}/answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ content: answerContent })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Answer submitted!");
                setAnswerContent("");
                fetchQuery(); // Refresh
            } else {
                toast.error(data.error || "Failed");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error submitting answer");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleLike = async (answerId) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/query/${id}/feedback`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ answerId })
            });
            const data = await res.json();
            if (res.ok) {
                // Optimistic update
                setQuery(prev => ({
                    ...prev,
                    answers: prev.answers.map(a =>
                        a._id === answerId ? { ...a, likes: !a.likes } : a
                    )
                }));
                toast.success(data.likes ? "Marked as helpful!" : "Unmarked");
            } else {
                toast.error(data.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><span className="animate-spin h-8 w-8 border-2 border-emerald-500 rounded-full border-t-transparent"></span></div>;
    if (!query) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Query not found</div>;

    const isCreator = currentUser && (currentUser._id === query.creatorId?._id || currentUser.id === query.creatorId?._id);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-4">
            {/* Background */}
            <div className="fixed inset-0 z-0 animate-aurora opacity-10 mix-blend-screen pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">

                {/* Question Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Image
                            src={query.creatorId?.profilePhoto || "/default-avatar.png"}
                            alt="User"
                            width={56}
                            height={56}
                            className="rounded-full border-2 border-white/10"
                        />
                        <div>
                            <h1 className="text-2xl font-bold">{query.title}</h1>
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <span>{query.creatorId?.name}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(query.createdAt), { addSuffix: true })}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-slate-200 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                        {query.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {query.skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-sm text-emerald-300 font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Answers Header */}
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Answers <span className="bg-white/10 text-sm px-2 py-0.5 rounded-full">{query.answers?.length || 0}</span>
                </h3>

                {/* Answers List */}
                <div className="space-y-6 mb-12">
                    {query.answers && query.answers.length > 0 ? (
                        query.answers.map((answer) => (
                            <div
                                key={answer._id}
                                className={`relative p-6 rounded-2xl transition-all ${answer.likes
                                    ? "bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                    : "bg-white/5 border border-white/10"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={answer.responderId?.profilePhoto || "/default-avatar.png"}
                                            alt="Responder"
                                            width={40}
                                            height={40}
                                            className="rounded-full"
                                        />
                                        <div>
                                            <h4 className="font-bold">{answer.responderId?.name}</h4>
                                            <p className="text-xs text-slate-400">
                                                {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Like Button (Visible to creator, or just status for others) */}
                                    {isCreator ? (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => toggleLike(answer._id)}
                                            className={`p-2 rounded-full transition-all ${answer.likes
                                                ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]"
                                                : "bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                                                }`}
                                            title="Mark as helpful"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </motion.button>
                                    ) : answer.likes && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0, y: 10 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            className="bg-gradient-to-r from-emerald-400 to-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
                                        >
                                            <motion.span
                                                animate={{ rotate: [0, 20, -20, 0] }}
                                                transition={{ duration: 0.5, delay: 0.2 }}
                                            >
                                                ✨
                                            </motion.span>
                                            Helpful
                                        </motion.div>
                                    )}
                                </div>

                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {answer.content}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 opacity-50 border border-dashed border-white/10 rounded-xl">
                            No answers yet. Be the first!
                        </div>
                    )}
                </div>

                {/* Answer Form */}
                {!isCreator && (
                    <div className="sticky bottom-6">
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl">
                            <form onSubmit={submitAnswer} className="relative">
                                <textarea
                                    value={answerContent}
                                    onChange={(e) => setAnswerContent(e.target.value)}
                                    placeholder="Write your solution..."
                                    rows={3}
                                    className="w-full bg-white/5 rounded-xl p-4 text-white focus:outline-none focus:bg-white/10 transition-colors resize-none pr-32"
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !answerContent.trim()}
                                    className="absolute bottom-4 right-4 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                                >
                                    {submitting ? "Sending..." : "Submit"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
