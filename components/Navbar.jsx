'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // 🔹 Check user on mount or path change
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    // 🔹 Auto-logout if user opens login page
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
  };

  // 🔹 Dynamic button generator
  const renderButtons = () => {
    if (!user) {
      // Not logged in
      return (
        <>
          <Link
            href="/auth/login"
            className="px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Get Started
          </Link>
        </>
      );
    }

    // Logged-in user
    const routes = [
      { key: "connect", path: `/connect/${user._id}`, label: "Connect", gradient: "from-blue-400 to-indigo-500" },
      { key: "search", path: `/search/${user._id}`, label: "Search", gradient: "from-green-400 to-teal-500" },
      { key: "profile", path: `/profile/${user._id}`, label: "Profile", gradient: "from-purple-400 to-pink-500" },
      // Chat should point to the chat listing page; use /chat (server will show user's conversations)
      { key: "chat", path: `/chat`, label: "Chat", gradient: "from-yellow-400 to-orange-500" }
    ];
    return (
      <>
        {routes
          // Build a stable prefix for each route and hide links that match current pathname prefix
          .filter((route) => {
            const prefix = route.path === "/chat" ? "/chat" : (route.path.split("/")[1] ? `/${route.path.split("/")[1]}` : route.path);
            return !pathname.startsWith(prefix);
          })
          .map((route) => (
            <Link
              key={route.key}
              href={route.path}
              className={`px-4 py-2 rounded-xl bg-gradient-to-r ${route.gradient} text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition`}
            >
              {route.label}
            </Link>
          ))}

        {/* 🚪 Logout Button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
        >
          Log Out
        </button>
      </>
    );
  };

  return (
    <nav className="w-full bg-blue-950 px-6 py-4 shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent font-[Poppins]">
          <Link href="/">SkillMatch</Link>
        </h1>
        <div className="flex gap-4 items-center">
          {renderButtons()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
