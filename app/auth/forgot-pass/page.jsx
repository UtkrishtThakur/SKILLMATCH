'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPasswordAction, resetPasswordAction } from "@/app/actions/actions";

export default function ForgotPassPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await forgotPasswordAction({ email: form.email });
      if (res.success) {
        setStep(2);
      } else {
        alert(res.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Forgot pass error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleNextToPass = (e) => {
    e.preventDefault();
    if (form.otp.length < 6) {
      alert("Please enter a valid OTP");
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPasswordAction({
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });

      if (res.success) {
        alert("Password reset successfully!");
        router.push("/auth/login");
      } else {
        alert(res.error || "Reset failed");
      }
    } catch (err) {
      console.error("Reset error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0a0a0a] text-white relative overflow-hidden selection:bg-emerald-500/30">

      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 animate-aurora opacity-20 mix-blend-screen pointer-events-none" />

      {/* Floating Orbs */}
      <div
        className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[100px] transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'}`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'}`}
      />

      <div className="w-full min-h-screen flex relative z-10">

        {/* Left Side Visual */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 p-12">
          <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-block px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-6">
              Account Recovery
            </div>

            <h1 className="text-6xl font-black tracking-tight mb-6 leading-tight">
              Regain Access to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                Your Workspace.
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-md leading-relaxed">
              Don't worry, we'll get you back in no time. Just follow the simple steps.
            </p>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className={`w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col gap-6 transition-all duration-700 ease-out delay-200 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>

            <div className="flex flex-col gap-1 text-center mb-2">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {step === 1 ? "Forgot Password?" : step === 2 ? "Verify Identity" : "New Password"}
              </h2>
              <p className="text-slate-400 text-sm">
                {step === 1 ? "Enter your email to receive an OTP" : step === 2 ? "Enter the 6-digit code sent to your email" : "Set your new secure password"}
              </p>
            </div>

            {/* Step Progress Bar */}
            <div className="flex gap-2 mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-white/10'}`}
                />
              ))}
            </div>

            {/* Form Steps */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Send OTP"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleNextToPass} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-all"
                >
                  Verify & Next
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-400 text-sm hover:text-white transition-colors"
                >
                  Change Email
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Reset Password"}
                </button>
              </form>
            )}

            <div className="text-center text-slate-500 text-sm mt-2">
              Remember your password?{" "}
              <Link href="/auth/login" className="text-emerald-400">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
