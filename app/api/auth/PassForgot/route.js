import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/otp";
import crypto from "crypto";
import { sendMail } from "@/lib/email";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req) {
  try {
    await dbConnect();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    // ❗ Prevent user enumeration
    if (!user) {
      return NextResponse.json(
        { message: "If the email exists, an OTP has been sent" },
        { status: 200 }
      );
    }

    await Otp.deleteMany({ email });

    const otp = generateOTP();

    await Otp.create({
      email,
      code: hashOTP(otp),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
      name: user.name,
      password: "__PENDING__", // placeholder
    });

    await sendMail({
      to: email,
      subject: "Password Reset OTP",
      html: `
        <p>Hi ${user.name},</p>
        <p>Your OTP is:</p>
        <h2>${otp}</h2>
        <p>Valid for 10 minutes.</p>
      `,
    });

    return NextResponse.json(
      { message: "If the email exists, an OTP has been sent" },
      { status: 200 }
    );
  } catch (err) {
    console.error("PassForgot error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
