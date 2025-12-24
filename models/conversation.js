// models/Conversation.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Conversation schema
 * - participants: exactly two User IDs for 1:1 chat
 * - lastMessage: optional reference to the most recent Message
 * - lastUpdated: timestamp for sorting chat lists
 *
 * Enforces uniqueness on participant pairs so duplicate chats don't exist.
 */
const conversationSchema = new Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure there are only two participants in a conversation
conversationSchema.pre("validate", function (next) {
  if (this.participants.length !== 2) {
    next(new Error("Conversation must have exactly two participants."));
  } else {
    next();
  }
});

// Prevent duplicate conversations (same two users)
conversationSchema.index(
  { participants: 1 },
  { unique: true, partialFilterExpression: { participants: { $size: 2 } } }
);

// Index for sorting by recently updated
conversationSchema.index({ lastUpdated: -1 });

// Auto-update `lastUpdated` when saving
conversationSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
