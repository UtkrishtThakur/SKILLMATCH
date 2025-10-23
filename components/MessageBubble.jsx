"use client";

import React from "react";
import Image from "next/image";

export default function MessageBubble({ message, currentUserId }) {
  // Support both canonical `content` and legacy `text`
  const text = message.content ?? message.text ?? "";
  const senderObj = message.sender ?? message.senderId ?? null;
  const isSender = senderObj ? String(senderObj._id || senderObj) === String(currentUserId) : false;

  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} my-2`}>
      {!isSender && (
        <Image
          src={(senderObj && senderObj.profilePhoto) || "/default-avatar.png"}
          alt={(senderObj && senderObj.name) || "User"}
          width={36}
          height={36}
          className="rounded-full mr-2"
        />
      )}
      <div
        className={`max-w-[70%] px-4 py-2 rounded-xl break-words ${
          isSender ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none"
        }`}
      >
        {/* Show sender name small above message */}
        <div className="text-xs text-gray-300 mb-1">
          {isSender ? "You" : (senderObj && (senderObj.name || senderObj.email) ? (senderObj.name || senderObj.email) : "Unknown")}
        </div>
        <p className="text-sm">{text}</p>
        <p className="text-xs text-gray-400 mt-1 text-right">{new Date(message.createdAt).toLocaleTimeString()}</p>
        {/* delete button for sender */}
        {isSender && typeof message._id !== 'undefined' && (
          <button onClick={() => typeof message.onDelete === 'function' ? message.onDelete(message._id) : null} className="ml-2 mt-1 text-xs text-red-300 hover:text-red-400">🗑️</button>
        )}
      </div>
      {isSender && (
        <Image
          src={(senderObj && senderObj.profilePhoto) || "/default-avatar.png"}
          alt={(senderObj && senderObj.name) || "You"}
          width={36}
          height={36}
          className="rounded-full ml-2"
        />
      )}
    </div>
  );
}
