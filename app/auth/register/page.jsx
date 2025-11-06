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
    <div className="min-h-screen bg-white flex items-start justify-center px-4 sm:px-6 lg:px-8 py-50 select-none relative overflow-hidden">
      {/* Decorative subtle blobs (matches login page style) */}
      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -top-36 -left-36 w-[420px] h-[420px] opacity-8 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="regBlob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#regBlob1)" />
      </svg>

      <svg
        aria-hidden="true"
        className="hidden sm:block absolute -bottom-36 -right-36 w-[420px] h-[420px] opacity-6 blur-3xl"
        viewBox="0 0 600 600"
      >
        <defs>
          <radialGradient id="regBlob2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#regBlob2)" />
      </svg>

      {/* Centered card — UI changed to match login look, wiring unchanged */}
      <form
        onSubmit={otpSent ? handleVerify : handleSubmit}
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
        style={{ marginTop: "3.5rem" }} // slight push to avoid navbar
      >
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight select-none text-center">
            {otpSent ? "Verify OTP" : "Create an Account"}
          </h2>
          <p className="text-white/75 text-sm text-center">
            {otpSent ? "Enter the code we sent to your email" : "Sign up to get started"}
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2 w-full">
          {!otpSent ? (
            <>
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="rounded-xl p-3 text-base bg-white/6 border border-white/12 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition w-full"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="rounded-xl p-3 text-base bg-white/6 border border-white/12 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition w-full"
              />
              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
                className="rounded-xl p-3 text-base bg-white/6 border border-white/12 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition w-full"
              />
            </>
          ) : (
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="rounded-xl p-3 text-base bg-white/6 border border-white/12 placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition w-full"
            />
          )}
        </div>

        <button
          type="submit"
          className="mt-3 py-3 bg-white text-[#1d365e] rounded-2xl font-semibold text-base sm:text-lg shadow-md hover:scale-105 transition-transform w-full"
        >
          {otpSent ? "Verify OTP" : "Register"}
        </button>

        <div className="text-center text-white/75 text-sm mt-1">
          <span>Already have an account? </span>
          <a href="/auth/login" className="text-white underline">
            Log in
          </a>
        </div>
      </form>

      <style jsx>{`
        .blur-3xl {
          filter: blur(28px);
        }

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
      `}</style>
    </div>
  );
}