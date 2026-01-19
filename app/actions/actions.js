"use server";

import { cookies } from "next/headers";
import { gatewayClient } from "@/lib/gateway_client";

/* =====================================================
   Helpers
   ===================================================== */

const COOKIE_NAME = "auth_token";
const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Wraps action execution to ensure consistent return shape.
 */
async function safe(fn) {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (err) {
        console.error("Action Error:", err.message);
        return { success: false, error: err.message || "An unexpected error occurred." };
    }
}

/**
 * Gets the Authorization header from the httpOnly cookie.
 * Throws if no token is present.
 */
// Helper to get token safely (async for Next.js 15+)
async function getAuthHeader() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
        throw new Error("Unauthorized: No session found.");
    }

    return { Authorization: `Bearer ${token}` };
}

/* =====================================================
   Auth Actions
   ===================================================== */

export async function loginAction(payload) {
    return safe(async () => {
        const data = await gatewayClient("auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (data.token) {
            const cookieStore = await cookies();
            cookieStore.set(COOKIE_NAME, data.token, COOKIE_OPTS);
        }

        // 🔒 SECURITY: Do NOT leak token to client
        const { token, ...safeData } = data;
        return safeData;
    });
}

export async function registerAction(payload) {
    return safe(async () => {
        // Register usually triggers OTP, no token yet
        return gatewayClient("auth/register", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    });
}

export async function verifyOtpAction(payload) {
    return safe(async () => {
        const data = await gatewayClient("auth/verify", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (data.token) {
            const cookieStore = await cookies();
            cookieStore.set(COOKIE_NAME, data.token, COOKIE_OPTS);
        }

        // 🔒 SECURITY: Do NOT leak token to client
        const { token, ...safeData } = data;
        return safeData;
    });
}

export async function logoutAction() {
    return safe(async () => {
        const cookieStore = await cookies();
        cookieStore.delete(COOKIE_NAME);
        return { message: "Logged out" };
    });
}

/* =====================================================
   User / Profile Actions
   ===================================================== */

export async function fetchUserAction(userId) {
    return safe(async () => {
        return gatewayClient(`api/user/${userId}`, {
            headers: await getAuthHeader(),
        });
    });
}

export async function updateUserAction(userId, payload) {
    return safe(async () => {
        return gatewayClient(`api/user/${userId}`, {
            method: "PUT",
            headers: await getAuthHeader(),
            body: JSON.stringify(payload),
        });
    });
}

export async function updatePasswordAction(userId, payload) {
    return safe(async () => {
        return gatewayClient(`api/user/${userId}/password`, {
            method: "PUT",
            headers: await getAuthHeader(),
            body: JSON.stringify(payload),
        });
    });
}

/* =====================================================
   Query Actions
   ===================================================== */

export async function fetchQueriesAction(view) {
    return safe(async () => {
        // Construct query params
        const params = new URLSearchParams();
        if (view) params.append("view", view);

        return gatewayClient(`api/query?${params.toString()}`, {
            headers: await getAuthHeader(),
        });
    });
}

export async function fetchQueryDetailAction(queryId) {
    return safe(async () => {
        return gatewayClient(`api/query/${queryId}`, {
            headers: await getAuthHeader(),
        });
    });
}

export async function postQueryAction(payload) {
    return safe(async () => {
        return gatewayClient("api/query", {
            method: "POST",
            headers: await getAuthHeader(),
            body: JSON.stringify(payload),
        });
    });
}

export async function answerQueryAction(queryId, payload) {
    return safe(async () => {
        return gatewayClient(`api/query/${queryId}/answer`, {
            method: "POST",
            headers: await getAuthHeader(),
            body: JSON.stringify(payload),
        });
    });
}

export async function feedbackQueryAction(queryId, payload) {
    return safe(async () => {
        return gatewayClient(`api/query/${queryId}/feedback`, {
            method: "PUT",
            headers: await getAuthHeader(),
            body: JSON.stringify(payload),
        });
    });
}

/* =====================================================
   Connect / Search Actions
   ===================================================== */

export async function searchUsersAction(term) {
    return safe(async () => {
        const params = new URLSearchParams({ query: term });
        return gatewayClient(`api/search?${params.toString()}`, {
            headers: await getAuthHeader(),
        });
    });
}

export async function requestConnectionAction(receiverId) {
    return safe(async () => {
        return gatewayClient("api/connect", {
            method: "POST",
            headers: await getAuthHeader(),
            body: JSON.stringify({ receiverId }),
        });
    });
}

export async function fetchConnectionsAction() {
    return safe(async () => {
        return gatewayClient("api/connect", {
            headers: await getAuthHeader(),
        });
    });
}

export async function respondConnectionAction(action, requestId) {
    return safe(async () => {
        return gatewayClient("api/connect", {
            method: "PUT",
            headers: await getAuthHeader(),
            body: JSON.stringify({ action, requestId }),
        });
    });
}


/* =====================================================
   Chat Actions
   ===================================================== */

export async function fetchConversationsAction() {
    return safe(async () => {
        return gatewayClient("api/chat/conversations", {
            headers: await getAuthHeader(),
        });
    });
}

export async function startConversationAction(receiverId) {
    return safe(async () => {
        return gatewayClient("api/chat/conversations", {
            method: "POST",
            headers: await getAuthHeader(),
            body: JSON.stringify({ receiverId }),
        });
    });
}

export async function fetchMessagesAction(conversationId, params = {}) {
    return safe(async () => {
        const qs = new URLSearchParams(params);
        return gatewayClient(`api/chat/${conversationId}?${qs.toString()}`, {
            headers: await getAuthHeader(),
        });
    });
}

export async function sendMessageAction(conversationId, content, tempId) {
    return safe(async () => {
        return gatewayClient(`api/chat/${conversationId}`, {
            method: "POST",
            headers: await getAuthHeader(),
            body: JSON.stringify({ content, tempId }), // Pass tempId for optimistic UI correlation if needed
        });
    });
}

/* =====================================================
   Notification Actions
   ===================================================== */

export async function fetchUnreadNotificationsAction() {
    return safe(async () => {
        return gatewayClient("api/notifications/unread", {
            headers: getAuthHeader(),
        });
    });
}
