'use client';
import React from "react";
import Link from "next/link";

const Footer = () => {
  const links = {
    platform: ["Browse Members", "Browse Projects", "Hackathons", "Leaderboard"],
    company: ["About Us", "Careers", "Blog", "Brand Assets"],
    resources: ["Help Center", "Community Guidelines", "API Documentation", "Status"]
  };

  return (
    <footer className="relative z-10 bg-[#050505] border-t border-white/5 text-white pt-20 pb-10 px-6 overflow-hidden">
      {/* Decorative Top Glow */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-600 to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">

          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col items-start">
            <h2 className="text-3xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">
              Skillmatch.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6 max-w-sm">
              The premier network for developers to find teammates, ship projects, and accelerate their careers.
              Join the squad today.
            </p>
            <div className="flex gap-4">
              {['twitter', 'github', 'discord'].map((icon) => (
                <div key={icon} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all cursor-pointer">
                  {/* Abstract circle for icon */}
                  <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Links Columns (Mapped) */}
          <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {Object.entries(links).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-white font-semibold uppercase tracking-wider text-sm mb-6">{category}</h4>
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item}>
                      <Link href="#" className="text-slate-500 hover:text-emerald-400 transition-colors text-sm font-medium">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs font-medium">
            &copy; {new Date().getFullYear()} Skillmatch Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-slate-600 hover:text-white text-xs font-medium transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-slate-600 hover:text-white text-xs font-medium transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;