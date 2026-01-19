'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/actions";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginAction(form);

      if (res.success) {
        // ✅ token is already stored in httpOnly cookie by server
        // ✅ user object can be stored for UI only
        localStorage.setItem("user", JSON.stringify(res.data.user));

        router.push(`/profile/${res.data.user._id}`);
      } else {
        alert(res.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }

    return (
      <div className="min-h-screen w-full flex bg-[#0a0a0a] text-white relative overflow-hidden selection:bg-emerald-500/30">

        {/* Background Aurora */}
        <div className="absolute inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none" />

        {/* Floating Orbs */}
        <div
          className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
            }`}
        />
        <div
          className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
            }`}
        />

        <div className="w-full min-h-screen flex relative z-10">

          {/* Left Side Visual */}
          <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 p-12">
            <div
              className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
            >
              <div className="inline-block px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-6">
                Welcome Back
              </div>

              <h1 className="text-6xl font-black tracking-tight mb-6 leading-tight">
                Log in to your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  Headquarters.
                </span>
              </h1>

              <p className="text-xl text-slate-400 max-w-md leading-relaxed">
                Connect with your team, manage projects, and ship faster.
              </p>
            </div>
          </div>

          {/* Right Side Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
            <form
              onSubmit={handleSubmit}
              className={`w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 transition-all duration-700 ease-out delay-200 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
            >
              <div className="flex flex-col gap-1 lg:hidden text-center mb-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Sign In
                </h2>
                <p className="text-slate-400 text-sm">Welcome back to Skillmatch</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-slate-300 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-slate-300 ml-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Log In"}
              </button>

              <div className="text-center text-slate-500 text-sm mt-2">
                Don’t have an account?{" "}
                <Link href="/auth/register" className="text-emerald-400">
                  Register here
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}