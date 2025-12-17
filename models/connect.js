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
      enum: ["profile", "request", "search"],
      default: "profile",
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Connection || mongoose.model("Connection", ConnectionSchema);
