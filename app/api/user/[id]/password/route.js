import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function PUT(req, context) {
  try {
    await dbConnect();

    // ✅ Get user ID from route params
    const { id } = context.params;

    // ✅ Get Authorization header
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

    // ✅ Check if token user matches requested user ID
    if (decoded.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { oldPassword, newPassword, confirmPassword } = await req.json();

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
    }

    // ✅ Find user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Old password is incorrect" }, { status: 400 });
    }

    // ✅ Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (err) {
    console.error("Password change error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
