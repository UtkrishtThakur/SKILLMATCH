import Pusher from "pusher";
import { NextResponse } from "next/server";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  try {
    const { conversationId, message } = await req.json();
    console.log("Pusher payload:", { conversationId, message });

    if (!conversationId || !message) {
      return NextResponse.json({ error: "Missing conversationId or message" }, { status: 400 });
    }

    await pusher.trigger(`chat-${conversationId}`, "new-message", message);

    console.log("Pusher trigger successful");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Pusher POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

