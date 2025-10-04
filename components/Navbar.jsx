'use client'
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const Navbar = () => {
  const [user, setUser] = useState(null); // stores user object
  const pathname = usePathname();
  const router = useRouter();

  // Check localStorage for token/user on mount and whenever pathname changes
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  }, [pathname]); // will run whenever route changes

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  const renderButtons = () => {
    if (!user) {
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
    } else {
      const buttons = [];

      // 🆕 If on landing page → show "Go to Profile"
      if (pathname === "/") {
        buttons.push(
          <Link
            key="profile"
            href={`/profile/${user._id}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Go to Profile
          </Link>
        );
      }
      // If on search page → go to profile
      else if (pathname.startsWith("/search")) {
        buttons.push(
          <Link
            key="profile"
            href={`/profile/${user._id}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Go to Profile
          </Link>
        );
      }
      // If on profile page → go to search
      else if (pathname.startsWith("/profile")) {
        buttons.push(
          <Link
            key="search"
            href={`/search/${user._id}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-400 to-teal-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Go to Search
          </Link>
        );
      }
      // Any other page → go to search
      else {
        buttons.push(
          <Link
            key="search"
            href={`/search/${user._id}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-400 to-teal-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Go to Search
          </Link>
        );
      }

      // Always add logout button
      buttons.push(
        <button
          key="logout"
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition"
        >
          Log Out
        </button>
      );

      return buttons;
    }
  };

  return (
    <nav className="w-full bg-blue-950 px-6 py-4 shadow-md">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent font-[Poppins]">
          <Link href="/">SkillMatch</Link>
        </h1>

        <div className="flex gap-4">{renderButtons()}</div>
      </div>
    </nav>
  );
};

export default Navbar;
