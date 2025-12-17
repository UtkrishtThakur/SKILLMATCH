import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        skills: {
            type: [String],
            required: true,
            default: [],
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
            enum: ["hackathon", "startup", "learning", "project", "other"],
        },
        interestedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active",
        },
    },
    { timestamps: true }
);

// Index for efficient querying
RequestSchema.index({ skills: 1, status: 1, createdAt: -1 });
RequestSchema.index({ creatorId: 1, status: 1 });

export default mongoose.models.Request || mongoose.model("Request", RequestSchema);
