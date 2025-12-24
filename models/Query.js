import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
    responderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    likes: {
        type: Boolean,
        default: false, // Simple feedback: Liked by query creator or not
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const QuerySchema = new mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: 150,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        skills: {
            type: [String],
            default: [],
            index: true, // For searching by skill
        },
        answers: [AnswerSchema],
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open",
        },
    },
    { timestamps: true }
);

// Indexes for efficient querying
QuerySchema.index({ skills: 1, status: 1, createdAt: -1 });

export default mongoose.models.Query || mongoose.model("Query", QuerySchema);
