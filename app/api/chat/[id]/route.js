import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import { verifyToken } from "@/utils/auth";

export async function GET(req, { params }) {
  await dbConnect();
  const user = await verifyToken(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const chat = await Chat.findById(params.id).populate("participants", "name profilePhoto");
  if (!chat || !chat.participants.some(p => p._id.toString() === user._id.toString()))
    return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });

  return new Response(JSON.stringify(chat), { status: 200 });
}
