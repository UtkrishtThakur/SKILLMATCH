// app/api/connect/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Connection from "@/models/connect";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectDB();

    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId } = await req.json();
    if (!receiverId) return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
    if (String(receiverId) === String(decoded.id)) return NextResponse.json({ error: "Cannot send request to yourself." }, { status: 400 });

    const existing = await Connection.findOne({
      $or: [
        { senderId: decoded.id, receiverId },
        { senderId: receiverId, receiverId: decoded.id },
      ],
    });

    if (existing) return NextResponse.json({ error: "Connection request already exists." }, { status: 400 });

    const newConnection = await Connection.create({ senderId: decoded.id, receiverId, status: "pending" });
    const populated = await newConnection.populate("senderId receiverId", "name profilePhoto skills description _id");

    return NextResponse.json({ success: true, connection: populated }, { status: 200 });
  } catch (error) {
    console.error("Connection POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = decoded.id;

    // Pending requests
    const received = await Connection.find({ receiverId: userId, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("senderId", "name profilePhoto skills description _id");

    const sent = await Connection.find({ senderId: userId, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("receiverId", "name profilePhoto skills description _id");

    // Accepted connections
    const acceptedDocs = await Connection.find({ status: "accepted", $or: [{ senderId: userId }, { receiverId: userId }] })
      .sort({ updatedAt: -1 })
      .populate("senderId receiverId", "name profilePhoto skills description _id");

    const connections = acceptedDocs.map(doc => {
      const other = String(doc.senderId._id) === String(userId) ? doc.receiverId : doc.senderId;
      return {
        _id: other._id,
        name: other.name,
        profilePhoto: other.profilePhoto,
        skills: other.skills,
        description: other.description,
        connectedAt: doc.updatedAt,
        connectDocId: doc._id,
        status: "accepted",
      };
    });

    return NextResponse.json({ received, sent, connections }, { status: 200 });
  } catch (err) {
    console.error("Connection GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Preflight responder
export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}
