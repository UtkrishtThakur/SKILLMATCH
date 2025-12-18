"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Pusher from "pusher-js";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [unreadConnects, setUnreadConnects] = useState(false);
    const [unreadChats, setUnreadChats] = useState(false);
    const [userId, setUserId] = useState(null);

    // 1. Initialize & Fetch Initial State
    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") return;

        const storedUser = localStorage.getItem("skillmatch_user") || localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (storedUser && token) {
            try {
                const parsed = JSON.parse(storedUser);
                setUserId(parsed._id || parsed.id);

                // Fetch initial counts
                fetch("/api/notifications/unread", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.unreadConnects) setUnreadConnects(true);
                        if (data.unreadChats) setUnreadChats(true);
                    })
                    .catch(err => console.error("Notification fetch error", err));

            } catch (e) { console.error(e); }
        }
    }, []);

    // 2. Pusher Subscription & Fallback Polling
    useEffect(() => {
        if (!userId) return;

        const token = localStorage.getItem("token");

        const fetchUnread = () => {
            if (!token) return;
            fetch("/api/notifications/unread", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.unreadConnects !== undefined) setUnreadConnects(data.unreadConnects);
                    if (data.unreadChats !== undefined) setUnreadChats(data.unreadChats);
                })
                .catch(err => console.error("Notification polling error", err));
        };

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            encrypted: true
        });

        const channel = pusher.subscribe(`user-${userId}`);

        const handleConnect = (data) => {
            console.log("Connect Notification:", data);
            setUnreadConnects(true);
        };

        const handleChat = (data) => {
            console.log("Chat Notification:", data);
            setUnreadChats(true);
        };

        const handleAccept = (data) => {
            console.log("Connect Accepted Notification:", data);
            // Optionally do something more specific here, but at least refresh state
            fetchUnread();
        };

        channel.bind("connect-request", handleConnect);
        channel.bind("new-message", handleChat);
        channel.bind("connect-accepted", handleAccept);

        // Fallback: Poll every 60 seconds
        const pollInterval = setInterval(fetchUnread, 60000);

        // Re-fetch on focus
        const handleFocus = () => fetchUnread();
        window.addEventListener("focus", handleFocus);

        return () => {
            channel.unbind("connect-request", handleConnect);
            channel.unbind("new-message", handleChat);
            channel.unbind("connect-accepted", handleAccept);
            pusher.unsubscribe(`user-${userId}`);
            clearInterval(pollInterval);
            window.removeEventListener("focus", handleFocus);
        };
    }, [userId]);

    const clearConnectNotifications = () => setUnreadConnects(false);
    const clearChatNotifications = () => setUnreadChats(false);

    return (
        <NotificationContext.Provider value={{
            unreadConnects,
            unreadChats,
            clearConnectNotifications,
            clearChatNotifications,
            setUnreadChats // exposed for ChatPage to clear
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}
