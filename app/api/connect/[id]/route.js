import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Connect from "@/models/connect";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    // params is available via destructuring argument
    const id = params.id;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });

    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (decoded.id !== id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, requestId } = await req.json();
    if (!action || !requestId)
      return NextResponse.json({ error: "action and requestId required" }, { status: 400 });

    if (!mongoose.Types.ObjectId.isValid(requestId))
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });

    const connectDoc = await Connect.findById(requestId);
    if (!connectDoc) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // Accept
    if (action === "accept") {
      if (String(connectDoc.receiverId) !== id)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });

      connectDoc.status = "accepted";
      await connectDoc.save();
      const populated = await connectDoc.populate(
        "senderId receiverId",
        "name email profilePhoto skills description _id"
      );
      return NextResponse.json({ message: "Request accepted", request: populated }, { status: 200 });
    }

    // Decline
    if (action === "decline") {
      if (String(connectDoc.receiverId) !== id)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });

      connectDoc.status = "declined";
      await connectDoc.save();
      return NextResponse.json({ message: "Request declined" }, { status: 200 });
    }

    // Cancel
    if (action === "cancel") {
      if (String(connectDoc.senderId) !== id)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      if (connectDoc.status !== "pending")
        return NextResponse.json({ error: "Only pending requests can be canceled" }, { status: 400 });

      await Connect.deleteOne({ _id: requestId });
      return NextResponse.json({ message: "Request canceled" }, { status: 200 });
    }

    // Remove
    if (action === "remove") {
      if (connectDoc.status !== "accepted")
        return NextResponse.json({ error: "Not an active connection" }, { status: 400 });
      if (String(connectDoc.senderId) !== id && String(connectDoc.receiverId) !== id)
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });

      await Connect.deleteOne({ _id: requestId });
      return NextResponse.json({ message: "Connection removed" }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Connect PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const decoded = verifyToken(req);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only allow fetching your own connect dashboard
    const requesterId = decoded.id || decoded._id;
    if (String(requesterId) !== String(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Received requests (others -> me) - return minimal sender summary
    const receivedDocs = await Connect.find({ receiverId: id, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("senderId", "name email profilePhoto skills description _id")
      .lean();

    const received = receivedDocs.map((doc) => ({
      requestId: doc._id,
      from: {
        _id: doc.senderId?._id || doc.senderId,
        name: doc.senderId?.name || "",
        email: doc.senderId?.email || "",
        profilePhoto: doc.senderId?.profilePhoto || "",
        skills: doc.senderId?.skills || [],
        description: doc.senderId?.description || "",
      },
      status: doc.status,
      createdAt: doc.createdAt,
    }));

    // Sent requests (me -> others) - return minimal receiver summary
    const sentDocs = await Connect.find({ senderId: id, status: "pending" })
      .sort({ createdAt: -1 })
      .populate("receiverId", "name email profilePhoto skills description _id")
      .lean();

    const sent = sentDocs.map((doc) => ({
      requestId: doc._id,
      to: {
        _id: doc.receiverId?._id || doc.receiverId,
        name: doc.receiverId?.name || "",
        email: doc.receiverId?.email || "",
        profilePhoto: doc.receiverId?.profilePhoto || "",
        skills: doc.receiverId?.skills || [],
        description: doc.receiverId?.description || "",
      },
      status: doc.status,
      createdAt: doc.createdAt,
    }));

    // Accepted connections (either role) - return the other user as 'user'
    const acceptedDocs = await Connect.find({ status: "accepted", $or: [{ senderId: id }, { receiverId: id }] })
      .sort({ updatedAt: -1 })
      .populate("senderId receiverId", "name email profilePhoto skills description _id")
      .lean();

    const connections = acceptedDocs.map((doc) => {
      const other = String(doc.senderId._id) === String(id) ? doc.receiverId : doc.senderId;
      return {
        connectDocId: doc._id,
        user: {
          _id: other._id,
          name: other.name,
          email: other.email,
          profilePhoto: other.profilePhoto,
          skills: other.skills,
          description: other.description,
        },
        connectedAt: doc.updatedAt,
      };
    });

    return NextResponse.json({ received, sent, connections }, { status: 200 });
  } catch (err) {
    console.error("Connect GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Respond to preflight requests (PUT/DELETE from browser will preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}
