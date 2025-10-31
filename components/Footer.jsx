'use client'
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#1d365e] text-white py-8 px-6 md:px-20 ">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand Name / Logo */}
        <div className="text-2xl font-extrabold select-none">
          <span className="bg-gradient-to-r from-white to-[#53ade0] bg-clip-text text-transparent">
            Skillmatch
          </span>
        </div>

        {/* Social Links */}
        <div className="flex gap-6">
          <a
            href="https://github.com/UtkrishtThakur"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-cyan-400 transition-colors"
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.61-4.033-1.61-.546-1.385-1.333-1.753-1.333-1.753-1.09-.745.082-.73.082-.73 1.204.085 1.837 1.237 1.837 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.774.418-1.304.763-1.604-2.665-.304-5.466-1.334-5.466-5.933 0-1.31.467-2.38 1.235-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 013.003-.404c1.02.005 2.047.14 3.003.404 2.29-1.553 3.296-1.23 3.296-1.23.653 1.653.243 2.873.119 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.625-5.475 5.922.43.37.815 1.11.815 2.237v3.32c0 .32.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>

          <a
            href="https://www.linkedin.com/in/utkrisht-thakur-b1831336a/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-cyan-400 transition-colors"
          >
            <svg
              className="w-6 h-6 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.026-3.038-1.851-3.038-1.851 0-2.134 1.445-2.134 2.94v5.667H9.354V9h3.415v1.561h.049c.476-.9 1.637-1.851 3.37-1.851 3.602 0 4.267 2.37 4.267 5.451v6.291zM5.337 7.433a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM6.95 20.452H3.723V9h3.227v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24H22.22c.981 0 1.78-.773 1.78-1.729V1.729C24 .774 23.206 0 22.225 0z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-slate-400 select-none text-sm mt-4">
        &copy; {new Date().getFullYear()} SkillMatch. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;