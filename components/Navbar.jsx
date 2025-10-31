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
      <nav className="fixed top-0 left-0 w-full bg-[#1d365e] rounded-b-3xl shadow-[0_10px_30px_rgba(29,54,94,0.5)] z-50 backdrop-filter backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between select-none">
          {/* Brand */}
          <h1 className="text-white text-3xl font-extrabold tracking-wide cursor-pointer bg-gradient-to-r from-white to-[#53ade0] bg-clip-text text-transparent select-text transition-transform duration-300 hover:scale-110">
            <Link href="/">Skillmatch</Link>
          </h1>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {!user ? (
              <>
                <Link
                  href="/auth/login"
                  className="text-white px-5 py-2 rounded-xl font-medium hover:bg-white/20 transition-colors drop-shadow-md hover:drop-shadow-lg transform hover:scale-105 active:scale-95 transition-transform"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-white to-[#53ade0] px-6 py-2 rounded-xl text-[#1d365e] font-semibold shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                >
                  Get Started
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
                      className="bg-gradient-to-r from-white to-[#53ade0] px-6 py-2 rounded-xl text-[#1d365e] font-semibold shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                    >
                      {route.label}
                    </Link>
                  ))}
                <button
                  onClick={handleLogout}
                  className="bg-pink-400 px-6 py-2 rounded-xl text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-transform"
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
            className="md:hidden flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-white rounded"
          >
            <span
              className={`block h-0.5 w-7 bg-white rounded origin-left transition-transform ${
                menuOpen ? "rotate-45 translate-y-[9px]" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-7 bg-white rounded transition-opacity ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-7 bg-white rounded origin-left transition-transform ${
                menuOpen ? "-rotate-45 -translate-y-[9px]" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Dropdown */}
        <div
          className={`md:hidden bg-[#1d365e] rounded-b-3xl overflow-hidden transition-max-height duration-500 ease-in-out ${
            menuOpen ? "max-h-[500px] py-4" : "max-h-0 py-0"
          }`}
        >
          {!user ? (
            <div className="flex flex-col gap-4 px-6">
              <Link
                href="/auth/login"
                className="text-white px-5 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors drop-shadow-md text-center hover:drop-shadow-lg transform hover:scale-105 active:scale-95 transition-transform"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-white to-[#53ade0] px-6 py-3 rounded-xl text-[#1d365e] font-semibold shadow-lg text-center hover:shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-6">
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
                    className="bg-gradient-to-r from-white to-[#53ade0] px-6 py-3 rounded-xl text-[#1d365e] font-semibold shadow-lg text-center hover:shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                    onClick={() => setMenuOpen(false)}
                  >
                    {route.label}
                  </Link>
                ))}
              <button
                onClick={handleLogout}
                className="bg-pink-200 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 transition-transform"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <style jsx>{`
        nav {
          /* Removed border */
          will-change: transform, box-shadow;
          backdrop-filter: saturate(180%) blur(15px);
        }
        nav:hover {
          box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.25),
            0 20px 40px rgba(29, 54, 94, 0.55);
          transform: translateY(-4px);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        div[aria-hidden] {
          will-change: max-height;
        }
      `}</style>
    </>
  );
};

export default Navbar;