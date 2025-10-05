import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();

    if (!query) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // ✅ Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 🔍 Build regex for search
    const regex = new RegExp(query, "i");

    // 🔹 Search users
    const users = await User.find({
      _id: { $ne: decoded.id }, // exclude logged-in user
      skills: { $exists: true, $ne: [] }, // must have skills
      $or: [
        { name: regex },
        { description: regex },
        { skills: regex },
      ],
    })
      .select("name skills description projects links profilePhoto")
      .limit(20);

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
