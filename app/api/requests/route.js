import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Request from "@/models/Request";
import { verifyToken } from "@/utils/auth";

// POST - Create a new request
export async function POST(req) {
    try {
        await dbConnect();
        const decoded = verifyToken(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { skills, description, tags } = await req.json();

        if (!skills || !skills.length || !description) {
            return NextResponse.json({ error: "Skills and description are required" }, { status: 400 });
        }

        const newRequest = await Request.create({
            creatorId: decoded.id,
            skills,
            description,
            tags: tags || [],
        });

        return NextResponse.json({ message: "Request created", request: newRequest }, { status: 201 });
    } catch (err) {
        console.error("Request POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET - Get all active requests (with optional filters)
export async function GET(req) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const skill = searchParams.get("skill");
        const tag = searchParams.get("tag");
        const creatorId = searchParams.get("creatorId");

        let query = { status: "active" };

        if (skill) {
            query.skills = { $in: [skill] };
        }

        if (tag) {
            query.tags = { $in: [tag] };
        }

        if (creatorId) {
            query.creatorId = creatorId;
        }

        const requests = await Request.find(query)
            .populate("creatorId", "name email profilePhoto skills")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ requests }, { status: 200 });
    } catch (err) {
        console.error("Request GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
