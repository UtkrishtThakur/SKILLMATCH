import mongoose from "mongoose";

const ConnectionSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    // Source tracking
    source: {
      type: String,
      enum: ["profile", "search"],
      default: "profile",
    },
  },
  { timestamps: true }
);

// Indexes for faster lookups of pending requests and connections
ConnectionSchema.index({ senderId: 1, status: 1 });
ConnectionSchema.index({ receiverId: 1, status: 1 });
ConnectionSchema.index({ status: 1 });

export default mongoose.models.Connection || mongoose.model("Connection", ConnectionSchema);
