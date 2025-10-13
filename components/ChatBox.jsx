"use client";
import React, { useState, useEffect, useRef } from "react";

export default function ChatBox({ chatId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const fetchChat = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/chat/${chatId}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setMessages(data.messages || []);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch("/api/chat", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ chatId, content: input }),
    });
    const data = await res.json();
    setMessages(data.messages);
    setInput("");
  };

  useEffect(() => {
    fetchChat();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-blue-950 rounded-xl p-4">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === user._id ? "text-right" : "text-left"}`}>
            <span className={`inline-block px-3 py-1 rounded-lg ${msg.sender === user._id ? "bg-green-500" : "bg-gray-700"}`}>
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-2 rounded-lg bg-blue-900 text-white" />
        <button onClick={sendMessage} className="px-3 py-2 bg-indigo-500 rounded-lg">Send</button>
      </div>
    </div>
  );
}
