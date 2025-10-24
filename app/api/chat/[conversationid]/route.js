import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/utils/auth";
import Conversation from "@/models/conversation";
import Chat from "@/models/Chat";
import pusher from "@/lib/pusher"; // your configured Pusher instance

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const tokenData = await verifyToken(req);
    if (!tokenData)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // ⚡ Next.js 14+ requires awaiting params for dynamic routes
    const { conversationid: conversationId } = await params;
    if (!conversationId)
      return NextResponse.json({ message: "Missing conversationId" }, { status: 400 });

    const raw = await Chat.find({ conversationId })
      .populate("senderId", "name email profilePhotoUrl") // use URL instead of base64
      .sort({ createdAt: 1 })
      .lean();

    const messages = raw.map((m) => ({
      _id: m._id,
      conversationId: String(m.conversationId),
      content: m.content,
      createdAt: m.createdAt,
      sender: m.senderId
        ? {
            _id: m.senderId._id || m.senderId,
            name: m.senderId.name,
            email: m.senderId.email,
            profilePhoto: m.senderId.profilePhotoUrl || null, // only URL
          }
        : null,
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (err) {
    console.error("GET /chat/[conversationId] error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const tokenData = await verifyToken(req);
    if (!tokenData)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { conversationid: conversationId } = await params;
    if (!conversationId)
      return NextResponse.json({ message: "Missing conversationId" }, { status: 400 });

    let body = {};
    try {
      const rawText = await req.text();
      if (rawText) body = JSON.parse(rawText);
    } catch {}

    const content = body?.content ?? body?.message ?? body?.text ?? null;
    const tempId = body?.tempId ?? null;
    if (!content || String(content).trim() === "")
      return NextResponse.json({ message: "Missing content" }, { status: 400 });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });

    const message = await Chat.create({
      conversationId,
      senderId: tokenData.id,
      content,
    });

    conversation.lastMessage = message._id;
    conversation.lastUpdated = Date.now();
    await conversation.save();

    const populated = await message.populate("senderId", "name email profilePhotoUrl");
    const normalized = {
      _id: populated._id,
      conversationId: String(populated.conversationId),
      content: populated.content,
      createdAt: populated.createdAt,
      sender: populated.senderId
        ? {
            _id: populated.senderId._id || populated.senderId,
            name: populated.senderId.name,
            email: populated.senderId.email,
            profilePhoto: populated.senderId.profilePhotoUrl || null, // URL only
          }
        : null,
    };

    // ⚡ Send only lightweight payload to Pusher
    try {
      await pusher.trigger(`chat-${conversationId}`, "new-message", normalized);
    } catch (e) {
      console.error("Pusher trigger failed:", e);
    }

    const resp = { message: "Message sent", data: normalized };
    if (tempId) resp.tempId = tempId;
    return NextResponse.json(resp, { status: 201 });
  } catch (err) {
    console.error("POST /chat/[conversationId] error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
