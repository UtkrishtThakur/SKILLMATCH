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

    const { receiverId, source } = await req.json();
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

    const newConn = await Connect.create({
      senderId: decoded.id,
      receiverId,
      status: "pending",
      source: source || "profile",
    });

    // ⚡ Notification: Trigger Pusher event for the receiver
    try {
      const pusher = (await import("@/lib/pusher")).default;
      await pusher.trigger(`user-${receiverId}`, "connect-request", {
        type: "connect",
        senderId: decoded.id,
        connectId: newConn._id,
        source: source || "profile",
      });
    } catch (pushErr) {
      console.error("Pusher notification failed:", pushErr);
    }

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

    const [receivedDocs, sentDocs, acceptedDocs] = await Promise.all([
      Connect.find({ receiverId: userId, status: "pending" })
        .populate("senderId", "name email profilePhoto skills description _id")
        .sort({ createdAt: -1 })
        .lean(),
      Connect.find({ senderId: userId, status: "pending" })
        .populate("receiverId", "name email profilePhoto skills description _id")
        .sort({ createdAt: -1 })
        .lean(),
      Connect.find({ status: "accepted", $or: [{ senderId: userId }, { receiverId: userId }] })
        .populate("senderId receiverId", "name email profilePhoto skills description _id")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    // Transform to match frontend expectations
    const received = receivedDocs.map(doc => ({
      _id: doc._id,
      from: doc.senderId,
      status: doc.status,
      createdAt: doc.createdAt,
      source: doc.source,
    }));

    const sent = sentDocs.map(doc => ({
      _id: doc._id,
      to: doc.receiverId,
      status: doc.status,
      createdAt: doc.createdAt,
      source: doc.source,
    }));

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
