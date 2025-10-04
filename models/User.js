import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Anonymous" },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    skills: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    profilePhoto: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
