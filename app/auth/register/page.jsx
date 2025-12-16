'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userTemp, setUserTemp] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  // Step 1: Register & send OTP
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        alert("OTP sent to your email!");
        setOtpSent(true);
        setUserTemp({ email: form.email, name: form.name || "Anonymous" });
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Something went wrong during registration");
    }
  }

  // Step 2: Verify OTP
  async function handleVerify(e) {
    e.preventDefault();

    if (!userTemp?.email) {
      alert("Temporary user data missing. Please try again.");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userTemp.email,
          code: otp,
          name: userTemp.name,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Registered successfully! Redirecting to profile...");
        router.push(`/profile/${data.user._id}`);
      } else {
        alert(data.error || "OTP verification failed");
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      alert("Something went wrong during OTP verification");
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#0a0a0a] text-white relative overflow-hidden selection:bg-emerald-500/30">

      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none"></div>

      {/* Floating Orbs */}
      <div className={`absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="w-full min-h-screen flex flex-row-reverse">

        {/* Right Side: Visual (Desktop Only) - Reversed from Login */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 relative z-10 p-12 text-right">
          <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-6">
              Join the Community
            </div>
            <h1 className="text-6xl font-black tracking-tight mb-6 leading-tight">
              Start building <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-400">
                Your Legacy.
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-md ml-auto leading-relaxed">
              Thousands of developers are waiting for a teammate like you.
            </p>
          </div>
          {/* Decorative Grid on Right */}
          <div className={`absolute bottom-0 right-0 w-full h-1/2 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none`}></div>
        </div>

        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
          <form
            onSubmit={otpSent ? handleVerify : handleSubmit}
            className={`
              w-full max-w-md
              bg-white/5 backdrop-blur-2xl
              border border-white/10
              rounded-3xl
              p-8 sm:p-10
              shadow-2xl
              flex flex-col gap-5
              transition-all duration-700 ease-out delay-200
              ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            `}
          >
            <div className="flex flex-col gap-1 lg:hidden text-center mb-2">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {otpSent ? "Verify Account" : "Get Started"}
              </h2>
              <p className="text-slate-400 text-sm">Join Skillmatch today</p>
            </div>

            <div className="space-y-5">
              {!otpSent ? (
                <>
                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-slate-300 ml-1 transition-colors group-focus-within:text-emerald-400">Full Name</label>
                    <input
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-slate-300 ml-1 transition-colors group-focus-within:text-emerald-400">Email Address</label>
                    <input
                      placeholder="name@example.com"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-slate-300 ml-1 transition-colors group-focus-within:text-emerald-400">Password</label>
                    <input
                      placeholder="Create a password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-slate-300 ml-1 transition-colors group-focus-within:text-emerald-400">Verification Code</label>
                  <input
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-center tracking-widest text-lg"
                  />
                  <p className="text-xs text-slate-500 ml-1">Check your email inbox for the code.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {otpSent ? "Verify & Enter" : "Create Account"}
            </button>

            <div className="text-center text-slate-500 text-sm mt-2">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}