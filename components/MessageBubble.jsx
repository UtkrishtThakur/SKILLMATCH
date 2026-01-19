'use client';

import React, { useState, useRef } from "react";
import Image from "next/image";

export default function MessageBubble({ message, currentUserId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const text = message.content ?? message.text ?? "";
  const senderObj = message.sender ?? message.senderId ?? null;
  const isSender = senderObj ? String(senderObj._id || senderObj) === String(currentUserId) : false;

  // nice animated classes
  const baseAnim = message.optimistic ? "opacity-80 scale-95" : "opacity-100 scale-100";
  const bubbleColor = isSender ? "bg-white text-[#1d365e]" : "bg-white/8 text-white";

  // delete handler wrapper (calls message.onDelete if present)
  const handleDelete = () => {
    setMenuOpen(false);
    if (typeof message.onDelete === "function") {
      message.onDelete(message._id);
    }
  };

  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} my-3 px-2`}>
      {!isSender && (
        <Image
          src={
            typeof (senderObj && senderObj.profilePhoto) === "string" && (senderObj.profilePhoto).trim()
              ? senderObj.profilePhoto
              : "/default-avatar.png"
          }
          alt={(senderObj && senderObj.name) || "User"}
          width={36}
          height={36}
          className="rounded-full mr-3 select-none object-cover"
        />
      )}

      <div className={`relative max-w-[75%] transition-transform duration-300 ${baseAnim}`}>
        <div
          className={`p-3 rounded-2xl ${isSender ? "rounded-br-none" : "rounded-bl-none"} ${bubbleColor} shadow-md transform hover:translate-y-[-3px] transition-all`}
          style={{ boxShadow: isSender ? "0 6px 18px rgba(0,0,0,0.12)" : "0 4px 12px rgba(0,0,0,0.12)" }}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="text-xs font-medium text-white/70 mb-1">
                {isSender ? "You" : (senderObj && (senderObj.name || senderObj.email) ? (senderObj.name || senderObj.email) : "Unknown")}
              </div>
              <div className="text-sm break-words whitespace-pre-wrap">{text}</div>
              <div className="text-xs text-white/40 mt-2 text-right">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ""}</div>
            </div>

            {/* three-dot menu trigger only for sender */}
            {isSender && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((s) => !s)}
                  className="ml-2 p-1 rounded hover:bg-white/10 transition"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  aria-label="Message options"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current text-white/70">
                    <circle cx="5" cy="12" r="1.8"></circle>
                    <circle cx="12" cy="12" r="1.8"></circle>
                    <circle cx="19" cy="12" r="1.8"></circle>
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-8 bg-white/6 backdrop-blur rounded-lg p-2 shadow-lg w-36 z-20 border border-white/10"
                  >
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-white/10 rounded transition"
                    >
                      Delete message
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/10 rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isSender && (
        <Image
          src={
            typeof (senderObj && senderObj.profilePhoto) === "string" && (senderObj.profilePhoto).trim()
              ? senderObj.profilePhoto
              : "/default-avatar.png"
          }
          alt={(senderObj && senderObj.name) || "You"}
          width={36}
          height={36}
          className="rounded-full ml-3 select-none object-cover"
        />
      )}
    </div>
  );
}