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
    <div className="min-h-screen w-full flex bg-[#0a0a0a] text-white relative overflow-hidden">

      <div className="w-full min-h-screen flex flex-row-reverse">

        {/* Right Visual */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 relative z-10 p-12 text-right">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <h1 className="text-6xl font-black tracking-tight mb-6 leading-tight">
              Start building <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-400">
                Your Legacy.
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-md ml-auto">
              Thousands of developers are waiting for a teammate like you.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
          <form
            onSubmit={otpSent ? handleVerify : handleRegister}
            className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl flex flex-col gap-5"
          >
            <h2 className="text-3xl font-bold text-center">
              {otpSent ? "Verify Account" : "Create Account"}
            </h2>

            {!otpSent ? (
              <>
                <input
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="input"
                />

                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="input"
                />

                <input
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="input"
                />
              </>
            ) : (
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="input text-center tracking-widest"
              />
            )}

            <button
              type="submit"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 font-bold rounded-xl transition"
            >
              {otpSent ? "Verify & Continue" : "Send OTP"}
            </button>

            <p className="text-center text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-emerald-400">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
