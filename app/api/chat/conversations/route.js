import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Conversation from "@/models/conversation";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";
import "@/models/Chat"; // Register Message model for population

// ✅ POST — Create or get an existing conversation between two users
export async function POST(req) {
  try {
    await dbConnect();

    const tokenData = await verifyToken(req);
    if (!tokenData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { receiverId } = await req.json();
    if (!receiverId) {
      return NextResponse.json({ message: "receiverId is required" }, { status: 400 });
    }

    const senderId = tokenData.id;
    if (receiverId === senderId) {
      return NextResponse.json({ message: "Cannot create chat with yourself" }, { status: 400 });
    }

    // Validate users exist
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    if (!sender || !receiver) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 🔒 Enforce Connection Status: Must be "accepted"
    const Connection = (await import("@/models/connect")).default;
    const connection = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
      status: "accepted",
    });

    if (!connection) {
      return NextResponse.json(
        { message: "You are not connected with this user." },
        { status: 403 }
      );
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // If not found, create a new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    return NextResponse.json(
      {
        message: "Conversation ready",
        conversation: {
          _id: conversation._id,
          participants: conversation.participants,
          lastUpdated: conversation.lastUpdated,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Conversation POST error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

// ✅ GET — Get all conversations for logged-in user
export async function GET(req) {
  try {
    await dbConnect();

    const tokenData = await verifyToken(req);
    if (!tokenData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = tokenData.id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email profilePhoto")
      .populate("lastMessage")
      .sort({ lastUpdated: -1 });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (err) {
    console.error("Conversation GET error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
