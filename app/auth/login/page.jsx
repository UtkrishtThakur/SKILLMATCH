'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false); // ✅ missing state added

  useEffect(() => {
    setAnimate(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        // ✅ Save token + user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ redirect to profile page
        router.push(`/profile/${data.user._id}`);
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-6 py-12 select-none relative overflow-hidden rounded-xl">
      {/* Blurred background blobs */}
      <svg
        aria-hidden="true"
        className="absolute -top-48 -left-48 w-[600px] h-[600px] opacity-20 animate-spin-slow blur-3xl"
        viewBox="0 0 600 600"
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
      >
        <defs>
          <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob2)" />
      </svg>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 -z-10 rounded-xl" />

      <form
        onSubmit={handleSubmit}
        className={`
          relative z-20 bg-white/20 backdrop-blur-md rounded-3xl max-w-md w-full p-10 shadow-2xl
          flex flex-col gap-6
          transition-all duration-1000 ease-out
          ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
      >
        <h2 className="text-4xl font-extrabold mb-6 text-center tracking-wide select-none bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Welcome Back
        </h2>

        <input
          placeholder="Email"
          type="email"
          className="rounded-xl p-3 text-lg border border-white/30 bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-4 focus:ring-cyan-400 transition"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          value={form.email}
          required
          autoComplete="email"
        />
        <input
          placeholder="Password"
          type="password"
          className="rounded-xl p-3 text-lg border border-white/30 bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-4 focus:ring-cyan-400 transition"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          value={form.password}
          required
          minLength={6}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl font-semibold text-lg text-white shadow-lg hover:brightness-110 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-400"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-white/80 mt-2">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-cyan-400 hover:underline">
            Register here
          </Link>
        </p>
      </form>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-reverse-slow { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-spin-slow { animation: spin-slow 40s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 50s linear infinite; }
      `}</style>
    </div>
  );
}
