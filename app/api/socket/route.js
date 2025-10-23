import { Server } from "socket.io";
import { NextResponse } from "next/server";

export const config = { api: { bodyParser: false } };

/**
 * Initialize socket.io server if possible.
 * Tries to use the Node server available on req.socket.server when present.
 * Exposes the io instance on globalThis.io so other routes can emit.
 */
function initSocket(req) {
  try {
    // If already initialized, return the instance
    if (globalThis.io) return globalThis.io;

    // Try to get the underlying Node server from the request (may be undefined in some runtimes)
    const server = req && req.socket && req.socket.server ? req.socket.server : null;
    if (!server) {
      // Cannot initialize without access to the Node server; leave initialization for later
      console.warn("Socket.IO: no server instance available on request.socket.server - will rely on existing globalThis.io if present.");
      return null;
    }

    // Avoid attaching multiple io instances
    if (server.io) {
      globalThis.io = server.io;
      return globalThis.io;
    }

    const io = new Server(server, {
      // ensure the server listens on the same path the client connects to
      path: "/api/socket",
      // allow same-origin in dev, adapt as needed for cross-origin setups
      cors: { origin: true },
      // Set pingTimeout for slower connections
      pingTimeout: 60000,
    });

    io.on("connection", (socket) => {
      console.log("Socket.IO: connection", socket.id);

      socket.on("joinRoom", (conversationId) => {
        try {
          if (conversationId) socket.join(String(conversationId));
        } catch (e) {
          console.error("joinRoom error:", e);
        }
      });

      socket.on("leaveRoom", (conversationId) => {
        try {
          if (conversationId) socket.leave(String(conversationId));
        } catch (e) {
          console.error("leaveRoom error:", e);
        }
      });

      socket.on("sendMessage", (payload) => {
        try {
          // payload expected: { conversationId, message }
          const conversationId = payload?.conversationId ?? payload?.room ?? null;
          const message = payload?.message ?? payload;
          if (conversationId && message) {
            // use the canonical newMessage event name for consistency
            io.to(String(conversationId)).emit("newMessage", message);
          }
        } catch (e) {
          console.error("sendMessage handler error:", e);
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket.IO: disconnect", socket.id, reason);
      });
    });

    // attach for later reuse
    server.io = io;
    try {
      globalThis.io = io;
    } catch (e) {
      // ignore in restricted environments
    }

    console.log("Socket.IO initialized and attached to server");
    return io;
  } catch (err) {
    console.error("Failed to initialize Socket.IO:", err);
    return null;
  }
}

// GET/POST handlers are simple placeholders that also attempt to init socket
export async function GET(req) {
  try {
    initSocket(req);
  } catch (e) {
    console.error("GET /api/socket init error:", e);
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(req) {
  try {
    initSocket(req);
  } catch (e) {
    console.error("POST /api/socket init error:", e);
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
