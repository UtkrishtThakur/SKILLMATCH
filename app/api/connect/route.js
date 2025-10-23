import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Connect from "@/models/connect";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await dbConnect();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId } = await req.json();
    if (!receiverId) return NextResponse.json({ error: "Receiver ID required" }, { status: 400 });
    if (String(receiverId) === String(decoded.id))
      return NextResponse.json({ error: "Cannot send request to yourself." }, { status: 400 });

    const existing = await Connect.findOne({
      $or: [
        { senderId: decoded.id, receiverId },
        { senderId: receiverId, receiverId: decoded.id },
      ],
    });
    if (existing) return NextResponse.json({ error: "Request already exists." }, { status: 400 });

    const newConn = await Connect.create({ senderId: decoded.id, receiverId, status: "pending" });
    return NextResponse.json({ message: "Request sent", connection: newConn }, { status: 200 });
  } catch (err) {
    console.error("Connect POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = decoded.id;

    const received = await Connect.find({ receiverId: userId, status: "pending" })
      .populate("senderId", "name email profilePhoto skills description _id")
      .sort({ createdAt: -1 })
      .lean();

    const sent = await Connect.find({ senderId: userId, status: "pending" })
      .populate("receiverId", "name email profilePhoto skills description _id")
      .sort({ createdAt: -1 })
      .lean();

    const acceptedDocs = await Connect.find({ status: "accepted", $or: [{ senderId: userId }, { receiverId: userId }] })
      .populate("senderId receiverId", "name email profilePhoto skills description _id")
      .sort({ updatedAt: -1 })
      .lean();

    const connections = acceptedDocs
      .map(doc => {
        const other = String(doc.senderId._id) === String(userId) ? doc.receiverId : doc.senderId;
        if (!other) return null;
        return { connectDocId: doc._id, user: other, connectedAt: doc.updatedAt };
      })
      .filter(Boolean);

    return NextResponse.json({ received, sent, connections }, { status: 200 });
  } catch (err) {
    console.error("Connect GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}
