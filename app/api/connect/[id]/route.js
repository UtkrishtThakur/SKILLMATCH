// app/api/connect/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import Connect from "@/models/connect";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

  const decoded = verifyToken(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Guard: user can only fetch their own connect dashboard
  const requesterId = decoded.id || decoded._id;
  if (String(requesterId) !== String(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Received requests (others -> me)
    const received = await Connect.find({ receiverId: id })
      .sort({ createdAt: -1 })
      .populate("senderId", "name email profilePhoto skills description _id");

    // Sent requests (me -> others)
    const sent = await Connect.find({ senderId: id })
      .sort({ createdAt: -1 })
      .populate("receiverId", "name email profilePhoto skills description _id");

    // Accepted connections (either role)
    const acceptedDocs = await Connect.find({ status: "accepted", $or: [{ senderId: id }, { receiverId: id }] })
      .sort({ updatedAt: -1 })
      .populate("senderId receiverId", "name email profilePhoto skills description _id");

    // Map accepted to the "other" user
    const connections = acceptedDocs.map((doc) => {
      const other = String(doc.senderId._id) === String(id) ? doc.receiverId : doc.senderId;
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

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requesterId = user.id || user._id;
    if (requesterId !== id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { action, requestId } = body;
    if (!action || !requestId) return NextResponse.json({ error: "action and requestId required" }, { status: 400 });

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });
    }

    const connectDoc = await Connect.findById(requestId);
    if (!connectDoc) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // Accept: only receiver can accept
    if (action === "accept") {
      if (String(connectDoc.receiverId) !== String(requesterId)) {
        return NextResponse.json({ error: "Not allowed to accept this request" }, { status: 403 });
      }
      connectDoc.status = "accepted";
      await connectDoc.save();
      const populated = await connectDoc.populate("senderId receiverId", "name email profilePhoto skills description _id");
      return NextResponse.json({ message: "Request accepted", request: populated }, { status: 200 });
    }

    // Decline: only receiver can decline
    if (action === "decline") {
      if (String(connectDoc.receiverId) !== String(requesterId)) {
        return NextResponse.json({ error: "Not allowed to decline this request" }, { status: 403 });
      }
      connectDoc.status = "declined";
      await connectDoc.save();
      return NextResponse.json({ message: "Request declined" }, { status: 200 });
    }

    // Cancel (sender cancels pending request)
    if (action === "cancel") {
      if (String(connectDoc.senderId) !== String(requesterId)) {
        return NextResponse.json({ error: "Not allowed to cancel this request" }, { status: 403 });
      }
      if (connectDoc.status !== "pending") {
        return NextResponse.json({ error: "Only pending requests can be canceled" }, { status: 400 });
      }
      await Connect.deleteOne({ _id: requestId });
      return NextResponse.json({ message: "Request canceled" }, { status: 200 });
    }

    // Remove connection (unfriend) - any participant can remove
    if (action === "remove") {
      if (connectDoc.status !== "accepted") {
        return NextResponse.json({ error: "Not an active connection" }, { status: 400 });
      }
      // Only participants allowed
      if (String(connectDoc.senderId) !== String(requesterId) && String(connectDoc.receiverId) !== String(requesterId)) {
        return NextResponse.json({ error: "Not allowed to remove this connection" }, { status: 403 });
      }
      await Connect.deleteOne({ _id: requestId });
      return NextResponse.json({ message: "Connection removed" }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Connect PUT error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
