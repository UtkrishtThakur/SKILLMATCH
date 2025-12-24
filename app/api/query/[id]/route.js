import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Query from "@/models/Query";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const id = (await params).id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid query ID" }, { status: 400 });
        }

        const decoded = verifyToken(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const query = await Query.findById(id)
            .populate("creatorId", "name profilePhoto role")
            .populate("answers.responderId", "name profilePhoto role")
            .lean();

        if (!query) {
            return NextResponse.json({ error: "Query not found" }, { status: 404 });
        }

        return NextResponse.json({ query }, { status: 200 });
    } catch (err) {
        console.error("Query GET Single error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
