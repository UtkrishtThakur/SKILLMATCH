// lib/socket.js
"use client";

import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (typeof window === "undefined") return null;
  if (!socket) {
    socket = io(window.location.origin, { path: "/api/socket" });
  }
  return socket;
};

export const joinConversation = (conversationId) => {
  const s = getSocket();
  if (!s || !conversationId) return;
  s.emit("joinRoom", conversationId);
};

export const leaveConversation = (conversationId) => {
  const s = getSocket();
  if (!s || !conversationId) return;
  s.emit("leaveRoom", conversationId);
};

export const sendMessage = (conversationId, message) => {
  const s = getSocket();
  if (!s || !conversationId || !message) return;
  s.emit("sendMessage", { conversationId, message });
};

export const onReceiveMessage = (callback) => {
  const s = getSocket();
  if (!s || typeof callback !== "function") return () => {};
  s.on("receiveMessage", callback);
  return () => s.off("receiveMessage", callback);
};

export const onNewMessage = (callback) => {
  const s = getSocket();
  if (!s || typeof callback !== "function") return () => {};
  s.on("newMessage", callback);
  return () => s.off("newMessage", callback);
};

export const onDeleteMessage = (callback) => {
  const s = getSocket();
  if (!s || typeof callback !== "function") return () => {};
  s.on("deleteMessage", callback);
  return () => s.off("deleteMessage", callback);
};
