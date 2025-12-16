'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    if (pathname.startsWith("/auth/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const routes = [
    { key: "connect", path: user ? `/connect/${user._id}` : "/connect", label: "Connect" },
    { key: "search", path: user ? `/search/${user._id}` : "/search", label: "Search" },
    { key: "profile", path: user ? `/profile/${user._id}` : "/profile", label: "Profile" },
    { key: "chat", path: `/chat`, label: "Chat" },
  ];

  return (
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl glass rounded-full z-50 transition-all duration-300">
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="text-2xl font-bold tracking-tight hover:scale-105 transition-transform duration-300">
            <span className="text-gradient">Skillmatch</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {!user ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-slate-300 hover:text-white px-4 py-2 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="group relative px-6 py-2 bg-white text-black rounded-full font-bold overflow-hidden transition-transform hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10 group-hover:text-white transition-colors">Get Started</span>
                </Link>
              </>
            ) : (
              <>
                {routes
                  .filter(
                    (route) =>
                      !pathname.startsWith(
                        route.path.split("/")[1]
                          ? `/${route.path.split("/")[1]}`
                          : route.path
                      )
                  )
                  .map((route) => (
                    <Link
                      key={route.key}
                      href={route.path}
                      className="relative px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium hover:bg-white/5 rounded-lg"
                    >
                      {route.label}
                    </Link>
                  ))}
                <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 font-medium transition-colors px-2"
                >
                  Log Out
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            className="md:hidden text-white focus:outline-none"
          >
            <div className={`w-6 h-0.5 bg-white mb-1.5 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <div className={`w-6 h-0.5 bg-white mb-1.5 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <div className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile Dropdown */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#0f172a]/90 backdrop-blur-xl rounded-2xl mt-2 mx-2 border border-white/10 ${menuOpen ? "max-h-[400px] opacity-100 mb-2" : "max-h-0 opacity-0"
            }`}
        >
          <div className="flex flex-col gap-2 p-4">
            {!user ? (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-center text-white/90 hover:bg-white/10 py-3 rounded-xl transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-center bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 rounded-xl font-bold"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {routes.map((route) => (
                  <Link
                    key={route.key}
                    href={route.path}
                    onClick={() => setMenuOpen(false)}
                    className="text-center text-white/90 hover:bg-white/10 py-3 rounded-xl transition-colors"
                  >
                    {route.label}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full bg-pink-500/20 text-pink-400 py-3 rounded-xl font-semibold hover:bg-pink-500/30 transition-colors"
                >
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;