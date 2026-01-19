"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import {
  searchUsersAction,
  requestConnectionAction,
} from "@/app/actions/actions";

const topSearchesSample = [
  "React",
  "Python",
  "DSA",
  "Node.js",
  "Machine Learning",
  "Next.js",
  "CSS",
  "TypeScript",
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => setAnimate(true), []);

  /* =========================
     SEARCH (SERVER ACTION)
  ========================= */

  const handleSearch = async (overrideQuery) => {
    const term = overrideQuery !== undefined ? overrideQuery : query;
    if (!term.trim()) {
      toast.error("Please enter a search term!");
      return;
    }

    setLoading(true);

    try {
      const res = await searchUsersAction(term);

      if (!res.success) {
        toast.error(res.error || "Search failed");
        setResults([]);
      } else {
        setResults(res.data.users || []);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
      toast.error("Search error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CONNECT (SERVER ACTION)
  ========================= */

  const handleConnect = async (receiverId, name) => {
    try {
      const res = await requestConnectionAction(receiverId);

      if (!res.success) {
        toast.error(res.error || "Failed to send request");
        return;
      }

      toast.success(`Connection request sent to ${name}!`);
    } catch (err) {
      console.error("Connect error:", err);
      toast.error("Error sending request");
    }
  };

  /* =========================
     UI BELOW — UNCHANGED
  ========================= */

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white pt-32 pb-20 px-4 md:px-8 relative overflow-hidden selection:bg-purple-500/30">

      {/* Background Aurora */}
      <div className="fixed inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center">

        {/* Header Section */}
        <div className={`text-center mb-12 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Teammate.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Search by skill, name, or role. Discover the talent you need.
          </p>
        </div>

        {/* Search Bar */}
        <div className={`w-full max-w-2xl relative mb-8 transition-all duration-700 delay-100 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-25 -z-10"></div>
          <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search e.g. React, Python, UI Design..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 px-6 py-3 focus:outline-none text-lg"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className={`flex flex-wrap justify-center gap-3 mb-16 max-w-3xl transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {topSearchesSample.map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term);
                handleSearch(term);
              }}
              className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-sm hover:bg-white/10 hover:border-white/30 transition-all font-medium"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className={`w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-300 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {results.length > 0 ? (
            results.map((user) => (
              <div
                key={user._id}
                className="group relative bg-[#111] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={user.profilePhoto || "/default-avatar.png"}
                      alt={user.name}
                      width={60}
                      height={60}
                      className="rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white">{user.name}</h3>
                      <p className="text-slate-500 text-xs capitalize">
                        {user.role || "Member"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(user.skills || []).slice(0, 4).map((skill, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p className="text-slate-400 text-sm line-clamp-2 mb-6 flex-1">
                    {user.description || "No bio available."}
                  </p>

                  <button
                    onClick={() => handleConnect(user._id, user.name)}
                    className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-colors shadow-lg"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))
          ) : (
            !loading && (
              <p className="col-span-full text-center text-slate-500">
                Try searching for a skill or role to see results.
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
