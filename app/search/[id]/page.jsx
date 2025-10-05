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

  useEffect(() => setAnimate(true), []);

  const handleSearch = async () => {
    if (!skill.trim()) return alert("Please enter a skill!");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/search?skill=${encodeURIComponent(skill)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setResults(data.users || []);
      } else {
        alert(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }

    setLoading(false);
  };

  const handleTopSearchClick = (term) => {
    setSkill(term);
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-6 py-10 text-white select-none relative">

      <h1 className={`text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 transition"}`}>
        🔍 Find Learners by Skill
      </h1>

      {/* Top Searches */}
      <div className="mb-8 flex flex-wrap justify-center gap-4">
        {topSearchesSample.map((term) => (
          <button
            key={term}
            onClick={() => handleTopSearchClick(term)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 text-white font-medium shadow-md hover:scale-110 transition"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="flex justify-center gap-4 mb-12">
        <input
          type="text"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="e.g. React, Python, DSA..."
          className="px-5 py-3 rounded-3xl border border-white/40 bg-white/20 text-white placeholder-white/70 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-400"
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleSearch(); }
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-3 rounded-3xl bg-gradient-to-r from-green-400 to-teal-500 font-semibold shadow-lg hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {results.length > 0 ? results.map(user => (
          <div key={user._id} className="bg-white/10 rounded-3xl p-6 flex flex-col items-center text-center backdrop-blur-md border border-white/30 hover:shadow-2xl hover:scale-[1.03] transition">
            <img
              src={user.profilePhoto || "/default-avatar.png"}
              alt={`${user.name} profile`}
              className="w-24 h-24 rounded-full mb-4 object-cover border-2"
              draggable={false}
            />
            <h2 className="text-xl font-bold mb-2">{user.name}</h2>
            <p className="text-white/70 text-sm mb-3">{user.description || "No description."}</p>
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              {user.skills?.slice(0,5).map((s,i) => (
                <span key={i} className="px-3 py-1 text-xs bg-gradient-to-r from-cyan-400 to-purple-500 text-white rounded-full">{s}</span>
              ))}
            </div>
            <Link href={`/profile/${user._id}`} className="px-6 py-2 mt-auto rounded-3xl bg-gradient-to-r from-purple-400 to-pink-500 text-white font-semibold shadow-lg hover:scale-105">
              View Profile
            </Link>
          </div>
        )) : !loading && <p className="col-span-full text-center text-white/70 text-lg mt-12">No users found. Try searching for a skill!</p>}
      </div>
    </div>
  );
}
