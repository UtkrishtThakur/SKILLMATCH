import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    if (!user.password)
      return NextResponse.json({ error: "Password not set. Please verify OTP first." }, { status: 401 });

    // ✅ Compare entered password with hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Exclude password from response
    const { password: _, ...userData } = user.toObject();

    return NextResponse.json(
      { message: "Login successful", token, user: userData },
      { status: 200 }
    );

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
