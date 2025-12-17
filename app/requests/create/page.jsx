"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function CreateRequestPage() {
    const router = useRouter();
    const [skills, setSkills] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);

    const tagOptions = ["hackathon", "startup", "learning", "project", "other"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const skillsArray = skills.split(",").map(s => s.trim()).filter(Boolean);

        if (!skillsArray.length || !description.trim()) {
            toast.error("Please provide skills and description");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    skills: skillsArray,
                    description: description.trim(),
                    tags,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Request posted!");
                router.push("/requests");
            } else {
                toast.error(data.error || "Failed to create request");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error creating request");
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (tag) => {
        setTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
            <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

            <div className="max-w-3xl mx-auto relative z-10">
                <h1 className="text-4xl font-black mb-2">
                    Post a <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Request</span>
                </h1>
                <p className="text-slate-400 mb-8">Looking for collaborators? Post your opportunity here.</p>

                <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 rounded-3xl p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Skills Required *</label>
                        <input
                            type="text"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="React, Node.js, Python (comma separated)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what you're looking for..."
                            rows={6}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {tagOptions.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${tags.includes(tag)
                                            ? "bg-violet-500 text-white"
                                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            {loading ? "Posting..." : "Post Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
