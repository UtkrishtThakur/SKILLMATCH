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

// Indexes
userSchema.index({ skills: 1 });
userSchema.index({ name: "text" }); // Text index for name search if needed, or simple index

export default mongoose.models.User || mongoose.model("User", userSchema);
