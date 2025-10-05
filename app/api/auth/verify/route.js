import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Otp from "@/models/otp";
import User from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, code, name } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    // Find OTP entry
    const otpEntry = await Otp.findOne({ email, code });
    if (!otpEntry) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    if (otpEntry.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    // ✅ Create full user
    const user = await User.create({
      name: name || otpEntry.name || "Anonymous",
      email: otpEntry.email,
      password: otpEntry.password, // hashed password from OTP registration
      verified: true,
      skills: [],
      projects: [],
      profilePhoto: "",
      description: "",
    });

    // Delete OTP entry
    await Otp.deleteOne({ _id: otpEntry._id });

    // Return user info (without password)
    const { password: _, ...userData } = user.toObject();

    return NextResponse.json(
      { message: "User verified successfully", user: userData },
      { status: 201 }
    );
  } catch (err) {
    console.error("OTP Verify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
