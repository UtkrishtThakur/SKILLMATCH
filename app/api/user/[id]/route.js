import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

// ✅ GET /api/user/:id -> fetch user profile
export async function GET(req, context) {
  try {
    const { params } = await context; // ✅ Await to satisfy Next.js rules
    const { id } = params;

    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Token missing" }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.id !== id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const user = await User.findById(id).select("-password");
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("GET User error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ PUT /api/user/:id -> update profile
export async function PUT(req, context) {
  try {
    const { params } = await context;
    const { id } = params;

    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    if (!token)
      return NextResponse.json({ error: "Token missing" }, { status: 401 });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.id !== id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, email, skills, projects, description, profilePhoto } = body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, skills, projects, description, profilePhoto },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (err) {
    console.error("PUT User error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
