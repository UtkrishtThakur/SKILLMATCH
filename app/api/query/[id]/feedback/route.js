import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Query from "@/models/Query";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const id = (await params).id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid query ID" }, { status: 400 });
        }

        const decoded = verifyToken(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { answerId } = await req.json();
        if (!answerId) return NextResponse.json({ error: "Answer ID required" }, { status: 400 });

        const query = await Query.findById(id);
        if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });

        // Only creator can give feedback
        if (String(query.creatorId) !== String(decoded.id)) {
            return NextResponse.json({ error: "Only the query creator can give feedback" }, { status: 403 });
        }

        const answer = query.answers.id(answerId);
        if (!answer) return NextResponse.json({ error: "Answer not found" }, { status: 404 });

        // Toggle like
        answer.likes = !answer.likes;
        await query.save();

        return NextResponse.json({ message: "Feedback updated", likes: answer.likes }, { status: 200 });
    } catch (err) {
        console.error("Feedback PUT error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
