'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userTemp, setUserTemp] = useState(null);
  const [animate, setAnimate] = useState(false);
  const router = useRouter();

  useEffect(() => setAnimate(true), []);

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
          name: userTemp.name, // Pass name if needed for the user document
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Store JWT token and user info
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Registered successfully! Redirecting to profile...");

        // ✅ Redirect to profile
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
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 select-none overflow-hidden">

      {/* Background Blobs */}
      <svg aria-hidden="true" className="absolute -top-48 -left-48 w-[400px] h-[400px] opacity-20 animate-spin-slow blur-3xl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob1)" />
      </svg>

      <svg aria-hidden="true" className="absolute -bottom-48 -right-48 w-[400px] h-[400px] opacity-25 animate-spin-reverse-slow blur-3xl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="blob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob2)" />
      </svg>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 -z-10 rounded-xl" />

      {/* Form Container */}
      <form
        onSubmit={otpSent ? handleVerify : handleSubmit}
        className={`relative z-20 bg-white/95 backdrop-blur-md rounded-3xl max-w-md w-full p-6 sm:p-8 md:p-10 shadow-2xl flex flex-col gap-4 md:gap-6 transition-all duration-1000 ease-out ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      >
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-wide bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
          {otpSent ? "Verify OTP" : "Create an Account"}
        </h2>

        {!otpSent ? (
          <>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="rounded-xl p-3 text-lg border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-4 focus:ring-cyan-400 transition"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="rounded-xl p-3 text-lg border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-4 focus:ring-cyan-400 transition"
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded-xl p-3 text-lg border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-4 focus:ring-cyan-400 transition"
            />
          </>
        ) : (
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="rounded-xl p-3 text-lg border border-gray-300 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-400 transition"
          />
        )}

        <button
          type="submit"
          className="mt-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl font-semibold text-lg text-white shadow-lg hover:brightness-110 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-400"
        >
          {otpSent ? "Verify OTP" : "Register"}
        </button>
      </form>

      {/* Animations styles */}
      <style jsx>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse-slow { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        .animate-spin-slow { animation: spin-slow 40s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 50s linear infinite; }
      `}</style>
    </div>
  );
}
