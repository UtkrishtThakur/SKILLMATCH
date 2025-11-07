'use client';
import { useState, useEffect } from "react";

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

  const handleSearch = async () => {
    if (!query.trim()) return alert("Please enter a search term!");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first!");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) setResults(data.users || []);
      else {
        alert(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }

    setLoading(false);
  };

  const handleTopSearchClick = async (term) => {
    setQuery(term);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first!");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/search?query=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setResults(data.users || []);
      else {
        alert(data.error || "Search failed");
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleConnect = async (receiverId, name) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first!");
        return;
      }

      const res = await fetch("/api/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Connection request sent to ${name}!`);
      } else {
        alert(data.error || "Failed to send request");
      }
    } catch (err) {
      console.error("Connect error:", err);
      alert("Error sending request.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Decorative subtle blobs (hidden on smallest screens) */}
      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -top-44 -left-44 w-[480px] h-[480px] opacity-6 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="sBlob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#sBlob1)" />
      </svg>

      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -bottom-44 -right-44 w-[480px] h-[480px] opacity-6 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="sBlob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#sBlob2)" />
      </svg>

      {/* Centered larger card matching login style (white page, dark card) */}
      <div
        className={`relative z-20 w-full max-w-5xl bg-[#1d365e] text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 transition-all duration-700 ease-out ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        style={{ marginTop: "2.5rem" }}
      >
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 tracking-tight select-text">
          🔍 Find Learners by Skill or Name
        </h1>

        {/* Top Searches */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {topSearchesSample.map((term) => (
            <button
              key={term}
              onClick={() => handleTopSearchClick(term)}
              className="px-4 py-2 rounded-full bg-white/10 text-white font-semibold shadow-sm hover:scale-105 hover:bg-white/20 transition-transform focus:outline-none focus:ring-4 focus:ring-white/10"
              type="button"
              aria-label={`Search for ${term}`}
            >
              {term}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. React, Python, DSA, AI..."
            className="w-full sm:max-w-xl px-4 py-3 rounded-2xl border border-white/20 bg-white/6 text-white placeholder-white/70 shadow-sm focus:outline-none focus:ring-4 focus:ring-white/10 transition"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            aria-label="Search input"
            spellCheck={false}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-3 sm:mt-0 px-6 py-3 rounded-2xl bg-white text-[#1d365e] font-semibold shadow hover:scale-105 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Execute search"
            type="button"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Results */}
        <main
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-live="polite"
          aria-label="Search results"
        >
          {results.length > 0 ? (
            results.map((user) => (
              <article
                key={user._id}
                className="bg-white/8 rounded-2xl p-6 flex flex-col items-center text-center border border-white/20 hover:shadow-xl hover:scale-[1.02] transition-transform duration-200"
                tabIndex={0}
                aria-label={`Profile card for ${user.name}`}
              >
                <img
                  src={user.profilePhoto || "/default-avatar.png"}
                  alt={`${user.name} profile photo`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4 border-4 border-white/10 object-cover shadow select-none"
                  draggable={false}
                />
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 truncate max-w-full">
                  {user.name}
                </h2>

                {/* Description — keep as before */}
                <p className="text-white/70 text-sm mb-3 line-clamp-3 h-[4.2rem] overflow-hidden text-ellipsis">
                  {user.description || "No description available."}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 justify-center mb-4 w-full max-w-[260px]">
                  {user.skills?.slice(0, 5).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs bg-white/10 text-white rounded-full shadow-sm select-text"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Projects */}
                {user.projects?.length > 0 && (
                  <div className="mb-4 text-sm text-white/70 truncate max-w-[260px]">
                    <strong className="text-white/80">Projects:</strong>{" "}
                    {user.projects.slice(0, 2).map((proj, i) => (
                      <a
                        key={i}
                        href={proj}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-white/90 ml-1 truncate inline-block max-w-[120px]"
                        title={proj}
                      >
                        {proj.length > 25 ? proj.slice(0, 25) + "..." : proj}
                      </a>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleConnect(user._id, user.name)}
                  className="mt-auto bg-white/10 hover:bg-white/20 px-5 py-2 rounded-2xl font-semibold text-white shadow-sm hover:scale-105 transition-transform"
                  aria-label={`Send connection request to ${user.name}`}
                >
                  Connect
                </button>
              </article>
            ))
          ) : (
            !loading && (
              <p className="col-span-full text-center text-white/80 text-base mt-8 select-text">
                No users found. Try another search term!
              </p>
            )
          )}
        </main>
      </div>

      <style jsx>{`
        .blur-3xl {
          filter: blur(28px);
        }

        @media (max-width: 480px) {
          .max-w-5xl { padding: 16px; }
          h1 { font-size: 1.25rem; }
          input { padding: 10px; }
        }
      `}</style>
    </div>
  );
}