import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/utils/auth";
import Conversation from "@/models/conversation";

export async function GET(req) {
  try {
    await dbConnect();
    const tokenData = await verifyToken(req);
    if (!tokenData)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // find all conversations for the logged-in user
    const conversations = await Conversation.find({
      participants: tokenData.id,
    })
      .populate("participants", "name email profilePhoto")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (err) {
    console.error("GET /chat error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const tokenData = await verifyToken(req);
    if (!tokenData)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { receiverId } = await req.json();
    if (!receiverId)
      return NextResponse.json({ message: "Receiver ID is required" }, { status: 400 });

    // check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [tokenData.id, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [tokenData.id, receiverId],
      });
    }

    const populatedConversation = await conversation.populate(
      "participants",
      "name email profilePhoto"
    );

    return NextResponse.json(
      { message: "Conversation ready", conversation: populatedConversation },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /chat error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
