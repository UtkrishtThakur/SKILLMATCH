import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    // ✅ Access params correctly
    const id = params.id;

    // ✅ Get token from headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized: Missing header" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });

    // ✅ Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verification failed:", err.message);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // ✅ Ensure user in token matches requested ID
    if (decoded.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await User.findById(id).select("-password");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
