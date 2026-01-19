// lib/gateway_client.js
import "server-only";

const GATEWAY_URL = process.env.SECUREX_GATEWAY_URL;
const API_KEY = process.env.SECUREX_API_KEY;

if (!GATEWAY_URL || !API_KEY) {
    throw new Error(
        "SECUREX CONFIG ERROR: SECUREX_GATEWAY_URL or SECUREX_API_KEY missing"
    );
}

/**
 * SecureX Gateway Client
 * ----------------------
 * A THIN, TRANSPARENT proxy helper.
 *
 * Responsibilities:
 * - Inject x-api-key
 * - Forward request AS-IS
 * - Return parsed response (json or text)
 *
 * Does NOT:
 * - Inspect JWT
 * - Rewrite paths
 * - Handle auth logic
 * - Infer business meaning
 */
export async function gatewayClient(path, options = {}) {
    // Normalize path (NO mutation beyond slash safety)
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = `${GATEWAY_URL}/${cleanPath}`;

    const headers = new Headers(options.headers || {});
    headers.set("x-api-key", API_KEY);

    // Set JSON content-type only if body is present and not already set
    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body,
        cache: "no-store",
    });

    // Try JSON first, fall back to text
    let payload;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        payload = await response.json();
    } else {
        payload = await response.text();
    }

    // Bubble up failure WITH context
    if (!response.ok) {
        const message =
            payload?.error ||
            payload?.message ||
            `Gateway Error ${response.status}`;

        const err = new Error(message);
        err.status = response.status;
        err.payload = payload;
        throw err;
    }

    return payload;
}
