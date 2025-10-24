import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/utils/auth";
import Chat from "@/models/Chat";
import pusher from "@/lib/pusher"; // <- import Pusher

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const tokenData = await verifyToken(req);
    if (!tokenData)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const conversationId = params.conversationId ?? params.conversationid ?? params.id ?? null;
    const messageId = params.messageId ?? params.messageid ?? params.mid ?? null;
    if (!conversationId || !messageId)
      return NextResponse.json({ message: "Missing params" }, { status: 400 });

    const msg = await Chat.findById(messageId);
    if (!msg)
      return NextResponse.json({ message: "Message not found" }, { status: 404 });

    // only sender can delete
    if (String(msg.senderId) !== String(tokenData.id))
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    await Chat.deleteOne({ _id: messageId });

    // ✅ PUSHER: emit delete to room
    try {
      await pusher.trigger(`chat-${conversationId}`, "delete-message", { _id: messageId });
    } catch (e) {
      console.error("Pusher delete trigger failed:", e);
    }

    return NextResponse.json({ message: "Deleted", deletedId: messageId }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/chat/[conversationId]/[messageId] error:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
