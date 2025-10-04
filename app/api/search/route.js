// File: /app/api/search/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

  const skill = searchParams.get("skill")?.trim();
  const currentUserId = searchParams.get("currentUserId")?.trim();
  console.log("[SEARCH] currentUserId:", currentUserId);

    if (!skill) return NextResponse.json({ users: [] });

    // Search users by skill (case-insensitive)
    let users = await User.find({
      skills: { $regex: skill, $options: "i" },
    })
      .select("name skills profilePhoto description _id")
      .lean();

    // Ensure profilePhoto and description are always present
    users = users.map(u => ({
      ...u,
      profilePhoto: u.profilePhoto || "/default-avatar.png",
      description: u.description || "",
    }));

    // Exclude logged-in user by _id
    if (currentUserId) {
      const before = users.length;
      users = users.filter((u) => u._id.toString() !== currentUserId);
      const after = users.length;
      console.log(`[SEARCH] Filtered out own profile: ${before - after} user(s) removed.`);
    }

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
