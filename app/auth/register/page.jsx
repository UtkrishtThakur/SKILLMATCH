'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerAction, verifyOtpAction } from "@/app/actions/actions";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  // STEP 1: Register + Send OTP (SERVER ACTION)
  async function handleRegister(e) {
    e.preventDefault();

    const res = await registerAction(form);

    if (!res.success) {
      alert(res.error || "Failed to send OTP");
      return;
    }

    alert("OTP sent to your email!");
    setOtpSent(true);
  }

  // STEP 2: Verify OTP (SERVER ACTION)
  async function handleVerify(e) {
    e.preventDefault();

    const res = await verifyOtpAction({
      email: form.email,
      code: otp,
      name: form.name,
    });

    if (!res.success) {
      alert(res.error || "OTP verification failed");
      return;
    }

    // JWT is already set as httpOnly cookie by server
    // Client NEVER sees token

    alert("Registered successfully!");
    router.push(`/profile/${res.data.user._id}`);
  }

  return (
    <div className="min-h-screen w-full flex bg-[#0a0a0a] text-white relative overflow-hidden selection:bg-emerald-500/30">

      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none" />

      {/* Floating Orbs */}
      <div
        className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
          }`}
      />
      <div
        className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
          }`}
      />

      <div className="w-full min-h-screen flex flex-row-reverse relative z-10">

        {/* Right Side Visual */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 p-12 text-right">
          <div
            className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
          >
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
        </div>

        {/* Left Side Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <form
            onSubmit={otpSent ? handleVerify : handleRegister}
            className={`w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 transition-all duration-700 ease-out delay-200 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
          >
            <div className="flex flex-col gap-1 lg:hidden text-center mb-2">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {otpSent ? "Verify" : "Sign Up"}
              </h2>
              <p className="text-slate-400 text-sm">Join Skillmatch today</p>
            </div>

            <div className="hidden lg:block text-center mb-2">
              <h2 className="text-3xl font-bold text-white">
                {otpSent ? "Verify Account" : "Create Account"}
              </h2>
            </div>

            <div className="space-y-5">
              {!otpSent ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                    <input
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                    <input
                      placeholder="name@example.com"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                    <input
                      placeholder="••••••••"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">One-Time Password</label>
                  <input
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-[0.5em] font-mono focus:border-emerald-500/50 transition-colors"
                  />
                  <p className="text-xs text-slate-500 text-center">Check your email for the code</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              {otpSent ? "Verify & Continue" : "Send OTP"}
            </button>

            <div className="text-center text-slate-500 text-sm mt-2">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                Log in here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
