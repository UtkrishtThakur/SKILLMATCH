'use client'
import { useEffect, useState } from "react";
import Link from "next/link";

const floatingImgs = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=200&q=80",
];

export default function Hero() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-[#1d365e] select-none">
      {/* TOP: white area with title and floating collaborator squares */}
      <header className="relative overflow-hidden pt-[5.5rem]"> {/* Added top padding to lower content below navbar */}
        <div className="max-w-6xl mx-auto px-6 py-20 relative">
          {/* Floating square images */}
          <div aria-hidden className="absolute inset-0 pointer-events-none">
            {floatingImgs.slice(0, 5).map((src, i) => {
              const left = [4, 12, 72, 82, 50][i] || (10 + i * 15);
              const top = [8, 28, 6, 40, 56][i] || (6 + i * 10);
              const delay = 200 + i * 150;
              const size = [80, 90, 72, 88, 76][i];
              return (
                <img
                  key={i}
                  src={src}
                  alt="collaborating people"
                  loading="lazy"
                  className={`absolute rounded-sm shadow-2xl transform transition-all will-change-transform`}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: size,
                    height: size,
                    objectFit: "cover",
                    borderRadius: 12,
                    boxShadow: "0 12px 30px rgba(29,54,94,0.12)",
                    opacity: animate ? 1 : 0,
                    transform: animate ? `translateY(0) rotate(${i % 2 ? 6 : -6}deg)` : `translateY(10px) rotate(0deg)`,
                    transition: `opacity 600ms ${delay}ms ease, transform 900ms ${delay}ms cubic-bezier(.2,.9,.3,1)`,
                    animation: `float-${i} ${6 + (i % 3)}s ease-in-out ${delay}ms infinite`,
                  }}
                />
              );
            })}
          </div>

          {/* Main Title */}
          <h1 className="relative z-10 text-center max-w-4xl mx-auto text-5xl sm:text-6xl font-extrabold leading-tight">
            <span>Find your </span>
            <span className="inline-block" aria-hidden>
              <span className="tracking-tight text-[#53ade0]">buddies</span>
            </span>
          </h1>

          {/* small tagline under title (kept subtle) */}
          <p className="relative z-10 mt-6 mx-auto max-w-2xl text-center text-lg text-[#6b7f95]">
            Connect with learners, collaborators and creators — discover teammates who share your skills and goals.
          </p>
        </div>

        {/* Removed arc separator SVG as requested */}
      </header>

      {/* BOTTOM: dark band with color #1d365e and content - this area uses that hex color */}
      <section style={{ background: "#1d365e" }} className="text-white h-[50vh]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto text-center">
            {/* Big heading below arc - similar text as earlier but now white with accents */}
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              Find your buddies
            </h2>

            {/* Description paragraph - kept same content as provided */}
            <p className="text-[#dbeaf6] text-base sm:text-lg leading-relaxed mb-8">
              SkillMatch is the ultimate hub for learners, creators, and innovators to connect, collaborate, and create.
              Find like-minded teammates, tackle projects together, and turn ideas into real-world impact. Whether you’re
              building skills, sharing knowledge, or exploring new challenges, SkillMatch makes collaboration effortless,
              fast, and inspiring — because great ideas thrive when minds meet.
            </p>

            {/* Social buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="https://github.com/UtkrishtThakur"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-white text-[#1d365e] rounded-lg font-semibold shadow-lg hover:scale-105 transform transition"
                aria-label="GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.95-3.2.7-3.88-1.54-3.88-1.54-.53-1.36-1.3-1.72-1.3-1.72-1.07-.73.08-.72.08-.72 1.18.08 1.8 1.21 1.8 1.21 1.05 1.79 2.75 1.27 3.42.97.11-.76.41-1.27.75-1.56-2.56-.29-5.26-1.28-5.26-5.68 0-1.25.45-2.27 1.19-3.07-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.07 11.07 0 012.9-.39c.98.01 1.97.13 2.9.39 2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.18 1.82 1.18 3.07 0 4.4-2.71 5.38-5.29 5.66.42.36.8 1.08.8 2.17 0 1.57-.01 2.83-.01 3.21 0 .3.2.66.79.55C20.71 21.39 24 17.08 24 12 24 5.73 18.27.5 12 .5z" />
                </svg>
                GitHub
              </a>

              <a
                href="https://www.linkedin.com/in/utkrisht-thakur-b1831336a/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-white text-[#1d365e] rounded-lg font-semibold shadow-lg hover:scale-105 transform transition"
                aria-label="LinkedIn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M4.98 3.5C4.98 4.88 3.88 6 2.49 6 1.11 6 0 4.88 0 3.5S1.11 1 2.49 1c1.39 0 2.49 1.12 2.49 2.5zM.5 8.5h4v13h-4v-13zM8.5 8.5h3.83v1.77h.05c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.66 4.8 6.12v7.17h-4v-6.36c0-1.52-.03-3.47-2.12-3.47-2.12 0-2.44 1.65-2.44 3.36v6.47h-4v-13z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Small wave-bottom so the dark band blends back to white */}
        <div className="relative">
          <svg
            viewBox="0 0 1440 80"
            className="w-full block"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path d="M0,64 C360,0 1080,120 1440,40 L1440,80 L0,80 Z" fill="#1d365e" />
            <path d="M0,0 L1440,0 L1440,40 C1080,120 360,0 0,64 Z" fill="#ffffff" opacity="0.06" />
          </svg>
        </div>
      </section>

      <style jsx>{`
        /* Floating subtle bob animations (unique per image via generated keyframes) */
        @keyframes float-0 { 0% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-10px) rotate(-2deg); } 100% { transform: translateY(0) rotate(-6deg); } }
        @keyframes float-1 { 0% { transform: translateY(0) rotate(6deg); } 50% { transform: translateY(-8px) rotate(2deg); } 100% { transform: translateY(0) rotate(6deg); } }
        @keyframes float-2 { 0% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-12px) rotate(-1deg); } 100% { transform: translateY(0) rotate(-5deg); } }
        @keyframes float-3 { 0% { transform: translateY(0) rotate(5deg); } 50% { transform: translateY(-9px) rotate(3deg); } 100% { transform: translateY(0) rotate(5deg); } }
        @keyframes float-4 { 0% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-7px) rotate(0deg); } 100% { transform: translateY(0) rotate(-4deg); } }

        /* Ensure the buddy word has the exact color */
        h1 span .tracking-tight { color: #53ade0; }

        /* Slight responsive adjustments */
        @media (max-width: 768px) {
          header div.absolute img { display: none; }
          h1 { font-size: 2.4rem; }
        }
      `}</style>
    </div>
  );
}