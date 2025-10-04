import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true }, // hashed password
});

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
