import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/models/otp";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, code, name } = await req.json();
    if (!email || !code)
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });

    const otpEntry = await Otp.findOne({ email, code });
    if (!otpEntry) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    if (otpEntry.expiresAt < new Date())
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || otpEntry.name || "Anonymous",
        email: otpEntry.email,
        password: otpEntry.password,
        verified: true,
        skills: [],
        projects: [],
        profilePhoto: "",
        description: "",
      });
    }

    // Remove OTP entry
    await Otp.deleteOne({ _id: otpEntry._id });

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userData } = user.toObject();

    return NextResponse.json(
      { message: "User verified successfully", token, user: userData },
      { status: 200 }
    );
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
