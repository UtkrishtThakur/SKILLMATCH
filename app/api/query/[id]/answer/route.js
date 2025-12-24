import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Query from "@/models/Query";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const id = (await params).id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid query ID" }, { status: 400 });
        }

        const decoded = verifyToken(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { content } = await req.json();
        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Answer content cannot be empty" }, { status: 400 });
        }

        const query = await Query.findById(id);
        if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });

        if (query.status === "closed") {
            return NextResponse.json({ error: "This query is closed." }, { status: 400 });
        }

        // Add answer
        const newAnswer = {
            responderId: decoded.id,
            content,
            createdAt: new Date(),
        };

        query.answers.push(newAnswer);
        await query.save();

        // Notify creator? (Implementation skipped for now, but good to have)

        return NextResponse.json({ message: "Answer submitted", answer: newAnswer }, { status: 201 });
    } catch (err) {
        console.error("Answer POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
