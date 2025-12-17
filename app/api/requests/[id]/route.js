import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Request from "@/models/Request";
import Connect from "@/models/connect";
import { verifyToken } from "@/utils/auth";
import pusher from "@/lib/pusher";

// GET - Get single request details
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const request = await Request.findById(id)
            .populate("creatorId", "name email profilePhoto skills")
            .populate("interestedUsers", "name email profilePhoto")
            .lean();

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        return NextResponse.json({ request }, { status: 200 });
    } catch (err) {
        console.error("Request GET error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Express interest (send connection request from this request)
export async function POST(req, { params }) {
    try {
        await dbConnect();
        const decoded = verifyToken(req);
        if (!decoded) {
            console.log("❌ No auth token");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: requestId } = await params;
        console.log("📥 Interest request for:", requestId, "from user:", decoded.id);

        const request = await Request.findById(requestId);
        if (!request) {
            console.log("❌ Request not found:", requestId);
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        const creatorId = request.creatorId;
        const senderId = decoded.id;

        console.log("👤 Creator:", creatorId, "Sender:", senderId);

        if (String(creatorId) === String(senderId)) {
            console.log("❌ User trying to connect to own request");
            return NextResponse.json({ error: "Cannot connect to your own request" }, { status: 400 });
        }

        // Check if connection already exists
        const existing = await Connect.findOne({
            $or: [
                { senderId, receiverId: creatorId },
                { senderId: creatorId, receiverId: senderId },
            ],
        });

        if (existing) {
            console.log("❌ Connection already exists:", existing._id, "Status:", existing.status);
            return NextResponse.json({ error: "Connection request already sent or you're already connected" }, { status: 400 });
        }

        console.log("✅ Creating new connection...");

        // Create connection with source tracking
        const newConn = await Connect.create({
            senderId,
            receiverId: creatorId,
            status: "pending",
            source: "request",
            requestId,
        });

        console.log("✅ Connection created:", newConn._id);

        // Add user to interested list
        if (!request.interestedUsers.includes(senderId)) {
            request.interestedUsers.push(senderId);
            await request.save();
            console.log("✅ Added to interested users");
        }

        // Trigger Pusher notification with request context
        try {
            await pusher.trigger(`user-${creatorId}`, "connect-request", {
                type: "connect",
                senderId,
                connectId: newConn._id,
                source: "request",
                requestId,
                requestSkills: request.skills,
                requestDescription: request.description.substring(0, 100) + "...",
            });
            console.log("✅ Pusher notification sent");
        } catch (pushErr) {
            console.error("⚠️ Pusher notification failed:", pushErr);
        }

        return NextResponse.json({ message: "Interest sent", connection: newConn }, { status: 200 });
    } catch (err) {
        console.error("❌ Interest POST error:", err);
        return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
    }
}

// PUT - Update request (close/reopen)
export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const decoded = verifyToken(req);
        if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { status } = await req.json();

        const request = await Request.findById(id);
        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (String(request.creatorId) !== String(decoded.id)) {
            return NextResponse.json({ error: "Not authorized to update this request" }, { status: 403 });
        }

        request.status = status;
        await request.save();

        return NextResponse.json({ message: "Request updated", request }, { status: 200 });
    } catch (err) {
        console.error("Request PUT error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
