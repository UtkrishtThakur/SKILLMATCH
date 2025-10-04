import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";
import bcrypt from "bcryptjs";

// ✅ Update password
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const decoded = verifyToken(req);

    if (!decoded || decoded.id !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();
    const user = await User.findById(params.id);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return NextResponse.json({ error: "Wrong current password" }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
