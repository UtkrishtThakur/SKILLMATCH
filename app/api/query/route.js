import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Query from "@/models/Query";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";

export async function POST(req) {
    try {
        await dbConnect();
        const decoded = verifyToken(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { title, description, skills } = await req.json();

        if (!title || !description || !skills || skills.length === 0) {
            return NextResponse.json({ error: "Title, description, and at least one skill are required." }, { status: 400 });
        }

        const newQuery = await Query.create({
            creatorId: decoded.id,
            title,
            description,
            skills,
        });

        return NextResponse.json({ message: "Query posted successfully", query: newQuery }, { status: 201 });
    } catch (err) {
        console.error("Query POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const decoded = verifyToken(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const view = searchParams.get("view") || "feed"; // feed, my-queries, solved

        let filter = {};

        if (view === "my-queries") {
            filter = { creatorId: decoded.id };
        } else if (view === "solved") {
            filter = { "answers.responderId": decoded.id };
        } else {
            // Feed: Show queries that match user's skills AND are NOT created by user
            const user = await User.findById(decoded.id).select("skills").lean();
            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

            // If user has no skills, show all? Or show none? Let's show all for now or maybe recent.
            // Better: Show all recent queries except own. Even better if we match skills.
            if (user.skills && user.skills.length > 0) {
                filter = {
                    creatorId: { $ne: decoded.id },
                    skills: { $in: user.skills },
                    status: "open", // Only show open queries in feed
                };
            } else {
                // Fallback if no skills: Show all open queries except own
                filter = {
                    creatorId: { $ne: decoded.id },
                    status: "open",
                };
            }
        }

        const queries = await Query.find(filter)
            .populate("creatorId", "name profilePhoto role")
            .populate("answers.responderId", "name profilePhoto role")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ queries }, { status: 200 });
    } catch (err) {
        console.error("Query GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
