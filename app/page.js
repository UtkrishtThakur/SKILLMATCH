'use client'
import { useEffect, useState } from "react";
import Link from "next/link";

const collaboratorsLeft = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=150&q=80",
];

const collaboratorsRight = [
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
];

export default function Home() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-center px-6 py-12 overflow-hidden select-none">
      
      {/* Animated blobs */}
      <svg aria-hidden="true" className="absolute -top-48 -left-48 w-[600px] h-[600px] opacity-20 animate-spin-slow blur-3xl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="blob1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="300" fill="url(#blob1)" />
      </svg>

      <svg aria-hidden="true" className="absolute -bottom-48 -right-48 w-[600px] h-[600px] opacity-25 animate-spin-reverse-slow blur-3xl" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
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

      {/* Left collaborators */}
      <div className="hidden md:flex flex-col gap-7 mr-16 z-20">
        {collaboratorsLeft.map((src, idx) => (
          <img
            key={`left-${idx}`}
            src={src}
            alt="Collaborator"
            loading="lazy"
            className={`rounded-full w-24 h-24 object-cover border-4 border-blue-800 shadow-lg cursor-pointer transform transition duration-500 hover:scale-110`}
            style={{
              opacity: animate ? 1 : 0,
              transform: animate ? "translateX(0)" : "translateX(-30px)",
              transitionDelay: `${idx * 150 + 300}ms`,
              filter: "drop-shadow(0 5px 10px rgb(0 0 0 / 0.4))"
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className="max-w-3xl text-center px-8 z-30 relative transition-all duration-1000 ease-out"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? "translateY(0)" : "translateY(24px)"
        }}
      >
        <header
          className="text-6xl font-extrabold tracking-tight mb-10 select-none bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-text"
          style={{
            transform: animate ? "scale(1)" : "scale(0.95)",
            opacity: animate ? 1 : 0,
            transition: "all 0.8s ease-out",
            animationFillMode: "forwards"
          }}
        >
          Find Your Buddies
        </header>

        <p
          className="text-lg md:text-xl text-slate-100 leading-relaxed max-w-lg mx-auto mb-12"
          style={{
            opacity: animate ? 1 : 0,
            transition: "opacity 1.2s ease-out 0.3s"
          }}
        >
          SkillMatch is the ultimate hub for learners, creators, and innovators to connect, collaborate, and create. Find like-minded teammates, tackle projects together, and turn ideas into real-world impact. Whether you’re building skills, sharing knowledge, or exploring new challenges, SkillMatch makes collaboration effortless, fast, and inspiring — because great ideas thrive when minds meet.
        </p>

        <div className="flex justify-center gap-8 flex-wrap">
          <a
            href="https://github.com/UtkrishtThakur"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-2xl text-white font-semibold text-lg hover:brightness-110 focus-visible:ring-4 ring-cyan-400 transform transition hover:scale-110 focus:outline-none focus:ring-offset-2"
          >
            GitHub
          </a>

          <a
            href="https://www.linkedin.com/in/utkrisht-thakur-b1831336a/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-2xl text-white font-semibold text-lg hover:brightness-110 focus-visible:ring-4 ring-blue-500 transform transition hover:scale-110 focus:outline-none focus:ring-offset-2"
          >
            LinkedIn
          </a>
        </div>

        
      </div>

      {/* Right collaborators */}
      <div className="hidden md:flex flex-col gap-7 ml-16 z-20">
        {collaboratorsRight.map((src, idx) => (
          <img
            key={`right-${idx}`}
            src={src}
            alt="Collaborator"
            loading="lazy"
            className="rounded-full w-24 h-24 object-cover border-4 border-blue-800 shadow-lg cursor-pointer transform transition duration-500 hover:scale-110"
            style={{
              opacity: animate ? 1 : 0,
              transform: animate ? "translateX(0)" : "translateX(30px)",
              transitionDelay: `${idx * 150 + 450}ms`,
              filter: "drop-shadow(0 5px 10px rgb(0 0 0 / 0.4))"
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes gradient-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-text { background-size: 200% 200%; animation: gradient-text 5s ease infinite; }

        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse-slow { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        .animate-spin-slow { animation: spin-slow 40s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 50s linear infinite; }
      `}</style>
    </div>
  );
}
