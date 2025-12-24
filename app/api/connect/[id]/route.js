import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Connect from "@/models/connect";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // FIX: Await params

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });

    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (decoded.id !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Received requests - REMOVED requestId populate
    const receivedDocs = await Connect.find({ receiverId: id, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("senderId", "name email profilePhoto skills description _id")
      .lean();

    const received = receivedDocs
      .filter(d => d.senderId)
      .map(d => ({
        requestId: d._id,
        from: d.senderId,
        status: d.status,
        createdAt: d.createdAt,
        source: d.source,
      }));

    // Sent requests - REMOVED requestId populate
    const sentDocs = await Connect.find({ senderId: id, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("receiverId", "name email profilePhoto skills description _id")
      .lean();

    const sent = sentDocs
      .filter(d => d.receiverId)
      .map(d => ({
        requestId: d._id,
        to: d.receiverId,
        status: d.status,
        createdAt: d.createdAt,
        source: d.source,
      }));

    // Accepted connections
    const acceptedDocs = await Connect.find({
      status: "accepted",
      $or: [{ senderId: id }, { receiverId: id }],
    })
      .sort({ updatedAt: -1 })
      .populate("senderId receiverId", "name email profilePhoto skills description _id")
      .lean();

    const connections = acceptedDocs
      .map(doc => {
        const other = String(doc.senderId._id) === String(id) ? doc.receiverId : doc.senderId;
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

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const id = (await params).id; // FIX: Await params

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });

    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (decoded.id !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, requestId } = await req.json();
    if (!action || !requestId)
      return NextResponse.json({ error: "action and requestId required" }, { status: 400 });

    if (!mongoose.Types.ObjectId.isValid(requestId))
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });

    const connectDoc = await Connect.findById(requestId);
    if (!connectDoc) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const senderId = connectDoc.senderId?._id || connectDoc.senderId;
    const receiverId = connectDoc.receiverId?._id || connectDoc.receiverId;

    if (action === "accept") {
      if (String(receiverId) !== String(id))
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });

      connectDoc.status = "accepted";
      await connectDoc.save();

      // Ensure there's a Conversation for these two users
      const Conversation = (await import("@/models/conversation")).default;
      let conversation = await Conversation.findOne({ participants: { $all: [senderId, receiverId] } });
      if (!conversation) {
        conversation = await Conversation.create({ participants: [senderId, receiverId] });
      }

      // Trigger Pusher for the sender
      try {
        const pusher = (await import("@/lib/pusher")).default;
        await pusher.trigger(`user-${senderId}`, "connect-accepted", {
          type: "connect-accepted",
          receiverId,
          conversationId: String(conversation._id),
        });
      } catch (pushErr) {
        console.error("Pusher acceptance notification failed:", pushErr);
      }

      // return conversation id so frontend can navigate to chat
      return NextResponse.json({ message: "Request accepted", conversationId: String(conversation._id) }, { status: 200 });
    }

    if (action === "decline") {
      if (String(receiverId) !== String(id))
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });

      connectDoc.status = "declined";
      await connectDoc.save();
      return NextResponse.json({ message: "Request declined" }, { status: 200 });
    }

    if (action === "cancel") {
      if (String(senderId) !== String(id))
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });

      await Connect.deleteOne({ _id: requestId });
      return NextResponse.json({ message: "Request canceled" }, { status: 200 });
    }

    if (action === "remove") {
      if (![String(senderId), String(receiverId)].includes(String(id)))
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });

      await Connect.deleteOne({ _id: requestId });
      return NextResponse.json({ message: "Connection removed" }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Connect PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}
