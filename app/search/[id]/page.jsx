'use client';
import { useState, useEffect } from "react";
import Link from "next/link";

const topSearchesSample = [
  "React", "Python", "DSA", "Node.js",
  "Machine Learning", "Next.js", "CSS", "TypeScript",
];

export default function SearchPage() {
  const [skill, setSkill] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  // 🔑 Get logged-in user ID from localStorage
  const currentUserId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : "";

  useEffect(() => setAnimate(true), []);

  const handleSearch = async () => {
    if (!skill.trim()) return;
    setLoading(true);

    try {
      const url =
        `/api/search?skill=${encodeURIComponent(skill)}` +
        (currentUserId ? `&currentUserId=${currentUserId}` : "");

      const res = await fetch(url);
      const data = await res.json();
      setResults(data.users || []);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }

    setLoading(false);
  };

  const handleTopSearchClick = (term) => {
    setSkill(term);
    setResults([]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-6 py-10 select-none overflow-x-hidden relative text-white flex flex-col items-center">

      {/* 🔵 Background blobs */}
      <svg aria-hidden="true" className="absolute -top-48 -left-48 w-[600px] h-[600px] opacity-20 animate-spin-slow blur-3xl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob1)" />
      </svg>

      <svg aria-hidden="true" className="absolute -bottom-48 -right-48 w-[600px] h-[600px] opacity-25 animate-spin-reverse-slow blur-3xl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob2)" />
      </svg>

      <div className="absolute inset-0 bg-black/60 -z-10 rounded-xl" />

      {/* Title */}
      <h1 className={`relative z-20 text-4xl sm:text-5xl font-extrabold mb-10 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent select-text transition-transform duration-700 ${animate ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        🔍 Find Learners by Skill
      </h1>

      {/* Top Searches */}
      <section className={`relative z-20 max-w-4xl w-full mb-12 bg-white/10 rounded-3xl p-6 shadow-lg backdrop-blur-md border border-white/20 transition-all duration-700 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <h2 className="text-xl font-semibold text-cyan-400 mb-4 select-text">
          🔥 Top Searches
        </h2>
        <div className="flex flex-wrap gap-4">
          {topSearchesSample.map((term) => (
            <button
              key={term}
              onClick={() => handleTopSearchClick(term)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 text-white font-medium shadow-md hover:scale-110 hover:brightness-110 transition transform focus:outline-none focus:ring-4 focus:ring-pink-400"
              type="button"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* Search Bar */}
      <div className={`relative z-20 flex justify-center gap-4 max-w-4xl w-full mb-12 transition-all duration-700 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <input
          type="text"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="e.g. React, DSA, Python..."
          className="flex-grow min-w-[280px] max-w-xl px-5 py-3 rounded-3xl border border-white/40 bg-white/20 text-white placeholder-white/70 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-400 backdrop-blur-sm transition"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          aria-label="Search skill input"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-7 py-3 rounded-3xl bg-gradient-to-r from-green-400 to-teal-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition disabled:opacity-50"
          aria-label="Execute search"
        >
          {loading ? (
            <span className="animate-pulse">Searching...</span>
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Results */}
      <main className={`relative z-20 max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {results.length > 0 ? (
          results.map((user) => (
            <article key={user._id} className="bg-white/10 rounded-3xl shadow-lg p-6 flex flex-col items-center text-center backdrop-blur-md border border-white/30 hover:shadow-2xl hover:scale-[1.03] transition">
              <img
                src={user.profilePhoto || "/default-avatar.png"}
                alt={`${user.name} profile photo`}
                className="w-24 h-24 rounded-full mb-5 border-4 object-cover"
                draggable={false}
              />
              <h2 className="text-2xl font-extrabold text-white mb-2 truncate">
                {user.name}
              </h2>
              <p className="text-white/75 text-sm mb-4">
                {user.description || "No description available."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-5">
                {user.skills?.slice(0, 5).map((s, i) => (
                  <span key={i} className="px-4 py-1 text-xs bg-gradient-to-r from-cyan-400 to-purple-500 text-white rounded-full">
                    {s}
                  </span>
                ))}
              </div>
              <Link href={`/profile/${user._id}`} className="mt-auto px-6 py-2 rounded-3xl bg-gradient-to-r from-purple-400 to-pink-500 text-white font-semibold shadow-lg hover:scale-105" aria-label={`View profile of ${user.name}`}>
                View Profile
              </Link>
            </article>
          ))
        ) : (
          !loading && (
            <p className="col-span-full text-center text-white/70 text-lg mt-12">
              No users found. Try searching for a skill!
            </p>
          )
        )}
      </main>

      <style jsx>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse-slow { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        .animate-spin-slow { animation: spin-slow 40s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 50s linear infinite; }
      `}</style>
    </div>
  );
}
