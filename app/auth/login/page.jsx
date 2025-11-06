'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

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
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
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
    <div className="min-h-screen bg-white flex items-start justify-center px-4 sm:px-6 lg:px-8 py-50 select-none relative overflow-hidden">
      {/* Decorative blobs - hidden on very small screens */}
      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -top-36 -left-36 w-[420px] h-[420px] opacity-8 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="bgBlob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#bgBlob1)" />
      </svg>

      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -bottom-36 -right-36 w-[420px] h-[420px] opacity-6 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="bgBlob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#bgBlob2)" />
      </svg>

      {/* Centered card — responsive sizing and spacing */}
      <form
        onSubmit={handleSubmit}
        className={`
          relative z-20 w-full
          max-w-md
          bg-[#1d365e] text-white
          rounded-3xl
          p-6 sm:p-8 md:p-10
          shadow-2xl border border-white/20
          flex flex-col gap-4
          transition-all duration-700 ease-out
          ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
        style={{ marginTop: "3.5rem" }}
      >
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight select-none text-center">
            Welcome Back
          </h2>
          <p className="text-white/70 text-sm text-center">Sign in to continue to your account</p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-sm text-white/80">Email</label>
          <input
            placeholder="Email"
            type="email"
            className="rounded-xl p-3 text-base bg-white/6 border border-white/12 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition w-full"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            value={form.email}
            required
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/80">Password</label>
          <input
            placeholder="Password"
            type="password"
            className="rounded-xl p-3 text-base bg-white/6 border border-white/12 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition w-full"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            value={form.password}
            required
            minLength={6}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-3 bg-white text-[#1d365e] rounded-2xl font-semibold text-base sm:text-lg shadow-md hover:scale-105 transition-transform disabled:opacity-60 w-full"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <div className="text-center text-white/75 mt-1 text-sm">
          <span>Don't have an account? </span>
          <Link href="/auth/register" className="text-white underline">
            Register here
          </Link>
        </div>
      </form>

      <style jsx>{`
        .blur-3xl {
          filter: blur(28px);
        }

        /* Make sure the card doesn't hug the navbar on very small screens */
        @media (max-width: 420px) {
          form {
            margin-top: 4.25rem !important;
            padding: 1rem !important;
            border-radius: 1rem !important;
          }
          h2 {
            font-size: 1.125rem;
          }
        }

        /* Slightly reduce the decorative blob impact on medium screens */
        @media (min-width: 640px) and (max-width: 1024px) {
          .blur-3xl {
            filter: blur(20px);
            opacity: 0.12;
          }
        }
      `}</style>
    </div>
  );
}