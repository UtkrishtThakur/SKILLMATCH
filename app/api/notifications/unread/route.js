import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // or dbconnect, checking previous usage
import { verifyToken } from "@/utils/auth";
import Connect from "@/models/connect";
import Conversation from "@/models/conversation";
import Chat from "@/models/Chat";

export async function GET(req) {
    try {
        // 1. Auth Check
        const tokenData = await verifyToken(req);
        if (!tokenData) {
            return NextResponse.json({ unreadConnects: false, unreadChats: false });
        }
        const userId = tokenData.id;

        await dbConnect();

        // 2. Check for Pending Connections (Receiver)
        const pendingConnect = await Connect.exists({
            receiverId: userId,
            status: "pending",
        });

        // 3. Check for Unread Messages
        // First, find all conversations the user is part of
        const conversationIds = await Conversation.find({ participants: userId }).distinct("_id");

        // Then check if any message in those chats hasn't been read by the user
        // Note: We should exclude messages sent by the user themselves, although `readBy` logic usually handles this?
        // User requirement: "unreadChats = true if there exists any message where User is a participant... and readBy does NOT contain user ID"
        // Ideally user reads their own message instantly, so 'readBy' should include sender.
        // However, safest query is:
        const unreadChat = await Chat.exists({
            conversationId: { $in: conversationIds },
            readBy: { $ne: userId }
        });

        return NextResponse.json({
            unreadConnects: !!pendingConnect,
            unreadChats: !!unreadChat,
        });
    } catch (err) {
        console.error("Unread API Error:", err);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
