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

    // 2. Pusher Subscription
    useEffect(() => {
        if (!userId) return;

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
            // Only trigger if we are NOT currently on that specific chat page?
            // Actually, requirement says "Disappear when user views the relevant page".
            // If user is ON the page, the page logic (GET) should mark as read.
            // But the global dot might flicker on briefly.
            // For now, simple logic: set true. If the user is on the chat page, 
            // they will likely trigger a read event or a refresh will clear it.
            // Better: We can check window.location? No, let's keep it simple as requested.
            setUnreadChats(true);
        };

        channel.bind("connect-request", handleConnect);
        channel.bind("new-message", handleChat);

        return () => {
            channel.unbind("connect-request", handleConnect);
            channel.unbind("new-message", handleChat);
            pusher.unsubscribe(`user-${userId}`);
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
