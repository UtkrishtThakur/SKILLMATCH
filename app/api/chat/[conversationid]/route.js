import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/utils/auth";
import Conversation from "@/models/conversation";
import Chat from "@/models/Chat";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const tokenData = await verifyToken(req);
    if (!tokenData)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Support different param casing: route file is [conversationid] so params may be { conversationid }
    const conversationId = params.conversationId ?? params.conversationid ?? params.id ?? null;
    if (!conversationId)
      return NextResponse.json({ message: "Missing conversationId" }, { status: 400 });

    const raw = await Chat.find({ conversationId })
      .populate("senderId", "name email profilePhoto")
      .sort({ createdAt: 1 })
      .lean();

    // Normalize messages so client always receives `sender` populated object
    const messages = raw.map((m) => ({
      _id: m._id,
      conversationId: String(m.conversationId),
      content: m.content,
      createdAt: m.createdAt,
      sender: m.senderId
        ? { _id: m.senderId._id || m.senderId, name: m.senderId.name, email: m.senderId.email, profilePhoto: m.senderId.profilePhoto }
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

    const conversationId = params.conversationId ?? params.conversationid ?? params.id ?? null;
    // Read raw request body defensively to capture malformed JSON or empty payloads
    let rawText = null;
    let body = {};
    try {
      rawText = await req.text();
      if (rawText) body = JSON.parse(rawText);
    } catch (e) {
      console.error("POST /api/chat: failed to parse JSON body", e, { rawText });
      // try fallback: leave body as {} and continue to return helpful 400 below
      body = {};
    }

    // Accept different body field names
    const content = (body && (body.content ?? body.message ?? body.text)) ?? null;
    // log headers for diagnostics
    try {
      const contentType = req.headers.get("content-type");
      const authHeader = req.headers.get("authorization");
      if (!contentType) console.warn("POST /api/chat: missing Content-Type header");
      if (!authHeader) console.warn("POST /api/chat: missing Authorization header");
      // helpful debug
      console.debug("POST /api/chat headers", { contentType, hasAuth: !!authHeader });
    } catch (e) {}

    const tempId = body && (body.tempId ?? null);
    if (!conversationId || !content || String(content).trim() === "") {
      console.error("POST /api/chat/:conversationId missing fields", { conversationId, rawText, body });
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });

    // Create message
    const message = await Chat.create({
      conversationId,
      senderId: tokenData.id,
      content,
    });

    conversation.lastMessage = message._id;
    conversation.lastUpdated = Date.now();
    await conversation.save();

    // populate senderId and normalize to `sender`
    const populated = await message.populate("senderId", "name email profilePhoto");
    const normalized = {
      _id: populated._id,
      conversationId: String(populated.conversationId),
      content: populated.content,
      createdAt: populated.createdAt,
      sender: populated.senderId
        ? { _id: populated.senderId._id || populated.senderId, name: populated.senderId.name, email: populated.senderId.email, profilePhoto: populated.senderId.profilePhoto }
        : null,
    };

    // Emit to room using globalThis.io if available
    try {
      const io = globalThis.io;
      if (io) {
        // emit a consistent event name for new messages
        io.to(String(conversationId)).emit("newMessage", normalized);
      }
    } catch (e) {
      console.error("Socket emit failed:", e);
    }

  // include tempId in response when present so clients can reconcile optimistic messages
  const resp = { message: "Message sent", data: normalized };
  if (tempId) resp.tempId = tempId;
  return NextResponse.json(resp, { status: 201 });
  } catch (err) {
    console.error("POST /chat/[conversationId] error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
