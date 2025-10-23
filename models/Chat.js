// models/Chat.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Chat message schema
 * - conversationId: reference to a Conversation document (one-to-one conversation)
 * - senderId: User who sent the message
 * - content: message text (string). If you later add attachments, add an attachments array or a type field.
 * - readBy: array of user ObjectId(s) who have read the message (for read receipts)
 * - createdAt/updatedAt: timestamps
 *
 * Indexes:
 * - conversationId + createdAt for fast retrieval of conversation messages in chronological order
 */
const messageSchema = new Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Compound index for quick reads of messages in a conversation sorted by time
messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
