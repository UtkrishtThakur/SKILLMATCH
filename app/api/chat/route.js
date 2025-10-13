import dbConnect from "@/lib/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { verifyToken } from "@/utils/auth";

export async function POST(req) {
  await dbConnect();
  const user = await verifyToken(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { receiverId } = await req.json();

  // Ensure users are connected before creating chat
  const connectionCheck = await Connection.findOne({
    $or: [
      { senderId: user._id, receiverId, status: "accepted" },
      { senderId: receiverId, receiverId: user._id, status: "accepted" }
    ]
  });

  if (!connectionCheck) return new Response(JSON.stringify({ error: "Users are not connected" }), { status: 403 });

  // Check if chat already exists
  let chat = await Chat.findOne({ participants: { $all: [user._id, receiverId] } });
  if (!chat) chat = await Chat.create({ participants: [user._id, receiverId] });

  return new Response(JSON.stringify(chat), { status: 201 });
}

export async function GET(req) {
  await dbConnect();
  const user = await verifyToken(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const chats = await Chat.find({ participants: user._id })
    .populate("participants", "name profilePhoto")
    .sort({ updatedAt: -1 });

  return new Response(JSON.stringify(chats), { status: 200 });
}

export async function PUT(req) {
  await dbConnect();
  const user = await verifyToken(req);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { chatId, content } = await req.json();
  if (!chatId || !content) return new Response(JSON.stringify({ error: "Missing chatId or content" }), { status: 400 });

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.includes(user._id)) return new Response(JSON.stringify({ error: "Invalid chat" }), { status: 404 });

  chat.messages.push({ sender: user._id, content });
  await chat.save();

  return new Response(JSON.stringify(chat), { status: 200 });
}
