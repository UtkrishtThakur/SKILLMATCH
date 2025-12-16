'use client';
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      title: "Smart Matching",
      desc: "AI-driven algorithms to find your perfect code companion based on tech stack and availability.",
      span: "col-span-1 md:col-span-2",
      gradient: "from-violet-500/20 to-purple-500/20"
    },
    {
      title: "Real-time Chat",
      desc: "Built-in low latency messaging to coordinate instantly.",
      span: "col-span-1",
      gradient: "from-emerald-500/20 to-green-500/20"
    },
    {
      title: "Project Showcase",
      desc: "Display your portfolio and attract serious collaborators.",
      span: "col-span-1",
      gradient: "from-fuchsia-500/20 to-pink-500/20"
    },
    {
      title: "Community Events",
      desc: "Participate in hackathons and coding sprints hosted on the platform.",
      span: "col-span-1 md:col-span-2",
      gradient: "from-indigo-500/20 to-blue-500/20"
    }
  ];

  const stats = [
    { label: "Active Devs", value: "10K+" },
    { label: "Matches Made", value: "50K+" },
    { label: "Countries", value: "120+" }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] text-white overflow-x-hidden selection:bg-purple-500/30">

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 animate-aurora opacity-30 mix-blend-screen pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none brightness-50 contrast-150"></div>

      <main className="relative z-10 flex flex-col items-center pt-32 px-6">

        {/* HERO SECTION */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-24">
          {/* Badge */}
          <div className={`mb-8 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-slate-200 tracking-wide">v2.0 is Live</span>
          </div>

          {/* Title */}
          <h1 className={`text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter leading-[0.9] text-white mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Find your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-violet-400 via-fuchsia-500 to-white animate-text-shimmer bg-[length:200%_auto]">
              Squad.
            </span>
          </h1>

          {/* Subtext */}
          <p className={`max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            The fastest way to connect with developers, designers, and creators.
            Stop searching in silence—start building in sync.
          </p>

          {/* Buttons */}
          <div className={`flex flex-col sm:flex-row gap-5 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link
              href="/auth/register"
              className="group relative px-10 py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(167,139,250,0.5)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 group-hover:text-white transition-colors">Start Building — Free</span>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className={`mt-20 grid grid-cols-3 gap-8 sm:gap-16 border-t border-white/10 pt-10 transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</span>
                <span className="text-sm font-medium text-slate-500 uppercase tracking-widest mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BENTO GRID FEATURES */}
        <section className="w-full max-w-6xl mx-auto mb-32">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Everything you need to <span className="text-emerald-400">collaborate.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((item, i) => (
              <div
                key={i}
                className={`${item.span} group relative overflow-hidden rounded-3xl border border-white/10 bg-[#111] p-8 hover:border-white/20 transition-all duration-500 hover:-translate-y-1`}
              >
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{item.desc}</p>
                </div>

                {/* Decorative Icon Blob */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all"></div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}