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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-8 py-12 text-white select-none relative overflow-x-hidden">
      {/* Background animated blobs */}
      <svg
        aria-hidden="true"
        className="absolute -top-48 -left-48 w-[600px] h-[600px] opacity-20 animate-spin-slow blur-3xl"
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Decorative background"
      >
        <defs>
          <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob1)" />
      </svg>

      <svg
        aria-hidden="true"
        className="absolute -bottom-48 -right-48 w-[600px] h-[600px] opacity-25 animate-spin-reverse-slow blur-3xl"
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Decorative background"
      >
        <defs>
          <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob2)" />
      </svg>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 -z-10 rounded-3xl" />

      {/* Title */}
      <h1
        className={`relative z-10 text-4xl sm:text-5xl font-extrabold mb-10 text-center bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent select-text transition-transform duration-700 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        🔍 Find Learners by Skill or Name
      </h1>

      {/* Top Searches */}
      <div
        className={`relative z-10 mb-10 flex flex-wrap justify-center gap-4 max-w-4xl mx-auto transition-all duration-700 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        aria-label="Top skill searches"
      >
        {topSearchesSample.map((term) => (
          <button
            key={term}
            onClick={() => handleTopSearchClick(term)}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 text-white font-semibold shadow-lg hover:scale-110 hover:brightness-110 transition-transform focus:outline-none focus:ring-4 focus:ring-pink-400"
            type="button"
            aria-label={`Search for ${term}`}
          >
            {term}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div
        className={`relative z-10 flex justify-center gap-4 max-w-4xl mx-auto mb-16 transition-all duration-700 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. React, Python, DSA, AI..."
          className="flex-grow max-w-md px-6 py-4 rounded-3xl border border-white/40 bg-white/20 text-white placeholder-white/70 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-400 transition"
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
          className="px-7 py-4 rounded-3xl bg-gradient-to-r from-green-400 to-teal-500 font-semibold shadow-lg hover:scale-105 hover:brightness-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed select-none"
          aria-label="Execute search"
          type="button"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Searching...
            </div>
          ) : (
            "Search"
          )}
        </button>
      </div>

      {/* Results */}
      <main
        className={`relative z-10 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-700 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        aria-live="polite"
        aria-label="Search results"
      >
        {results.length > 0 ? (
          results.map((user) => (
            <article
              key={user._id}
              className="bg-white/10 rounded-3xl p-6 flex flex-col items-center text-center backdrop-blur-md border border-white/30 hover:shadow-2xl hover:scale-[1.03] transition-transform duration-300"
              tabIndex={0}
              aria-label={`Profile card for ${user.name}`}
            >
              <img
                src={user.profilePhoto || "/default-avatar.png"}
                alt={`${user.name} profile photo`}
                className="w-24 h-24 rounded-full mb-5 border-4 border-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 object-cover shadow-md select-none"
                draggable={false}
              />
              <h2 className="text-2xl font-extrabold text-white mb-2 truncate max-w-full">
                {user.name}
              </h2>
              <p className="text-white/75 text-sm mb-4 line-clamp-3 h-[4.5rem] overflow-hidden text-ellipsis">
                {user.description || "No description available."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-5 w-full max-w-[280px]">
                {user.skills?.slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="px-4 py-1 text-xs bg-gradient-to-r from-cyan-400 to-purple-500 text-white rounded-full shadow-sm select-text"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              {user.projects?.length > 0 && (
                <div className="mb-4 text-sm text-white/70 truncate max-w-[280px]">
                  <strong className="text-cyan-300">Projects:</strong>{" "}
                  {user.projects.slice(0, 2).map((proj, i) => (
                    <a
                      key={i}
                      href={proj}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-pink-400 ml-1 truncate inline-block max-w-[120px]"
                      title={proj}
                    >
                      {proj.length > 25 ? proj.slice(0, 25) + "..." : proj}
                    </a>
                  ))}
                </div>
              )}
              <button
                onClick={() => handleConnect(user._id, user.name)} // ✅ FIXED
                className="mt-auto bg-gradient-to-r from-purple-400 to-pink-500 px-6 py-2 rounded-3xl font-semibold hover:scale-105 transition-transform shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-400 select-none"
                aria-label={`Send connection request to ${user.name}`}
              >
                Connect
              </button>
            </article>
          ))
        ) : (
          !loading && (
            <p className="col-span-full text-center text-white/70 text-lg mt-12 select-text">
              No users found. Try another search term!
            </p>
          )
        )}
      </main>

      <style jsx>{`
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-reverse-slow {
          0% {
            transform: rotate(360deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 40s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 50s linear infinite;
        }
        .border-gradient-to-tr {
          border-image-slice: 1;
          border-width: 4px;
          border-style: solid;
          border-image-source: linear-gradient(to top right, #22d3ee, #a78bfa, #ec4899);
        }
      `}</style>
    </div>
  );
}
