import nodemailer from "nodemailer";

export async function sendOtpEmail(to, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"SkillMatch" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Code - SkillMatch",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });

  console.log("📩 OTP sent:", otp);
}
