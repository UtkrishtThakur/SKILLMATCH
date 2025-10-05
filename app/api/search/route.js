import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    await dbConnect();

    // ✅ Get JWT from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const url = new URL(req.url);
    const skillQuery = url.searchParams.get("skill")?.trim() || "";
    const currentUserId = url.searchParams.get("currentUserId");

    if (!skillQuery) {
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    // ✅ Find users who have the skill, excluding current user
    const users = await User.find({
      skills: { $regex: new RegExp(skillQuery, "i") },
      _id: { $ne: currentUserId },
    }).select("name email skills description profilePhoto");

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
