import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Connection from "@/models/connect";
import { verifyToken } from "@/utils/auth";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();

    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 }
      );
    }

    // Prevent self connection
    if (String(receiverId) === String(decoded.id)) {
      return NextResponse.json({ error: "You cannot send a request to yourself." }, { status: 400 });
    }

    // Check if already connected or pending
    const existing = await Connection.findOne({
      $or: [
        { senderId: decoded.id, receiverId: receiverId },
        { senderId: receiverId, receiverId: decoded.id },
      ],
    });

    if (existing) {
      return NextResponse.json(
        { error: "Connection request already exists." },
        { status: 400 }
      );
    }

    // Create new request
    const newConnection = await Connection.create({ senderId: decoded.id, receiverId, status: "pending" });
    const populated = await newConnection.populate("senderId", "name email profilePhoto skills description _id");

    return NextResponse.json({ success: true, message: "Connection request sent.", connection: populated }, { status: 200 });
  } catch (error) {
    console.error("Connection send error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = decoded.id;

    // Received requests (others -> me)
    const received = await Connection.find({ receiverId: userId, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("senderId", "name email profilePhoto skills description _id");

    // Sent requests (me -> others)
    const sent = await Connection.find({ senderId: userId, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("receiverId", "name email profilePhoto skills description _id");

    // Accepted connections (either role)
    const acceptedDocs = await Connection.find({ status: "accepted", $or: [{ senderId: userId }, { receiverId: userId }] })
      .sort({ updatedAt: -1 })
      .populate("senderId receiverId", "name email profilePhoto skills description _id");

    const connections = acceptedDocs.map((doc) => {
      const other = String(doc.senderId._id) === String(userId) ? doc.receiverId : doc.senderId;
      return {
        _id: other._id,
        name: other.name,
        email: other.email,
        profilePhoto: other.profilePhoto,
        skills: other.skills,
        description: other.description,
        connectedAt: doc.updatedAt,
        connectDocId: doc._id,
      };
    });

    return NextResponse.json({ received, sent, connections }, { status: 200 });
  } catch (err) {
    console.error("Connect GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
