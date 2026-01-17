/**
 * SecureX Gateway Client (Next.js / JS)
 * Strictly routes ALL traffic via SecureX Gateway
 */

const GATEWAY_BASE = "https://gateway.devlooper.co.in";

export async function gatewayClient(
    endpoint,
    {
        method = "GET",
        headers = {},
        body = null,
        params = null,
        cookies: explicitCookies = null, // for manual server action override
    } = {}
) {
    const isServer = typeof window === "undefined";

    // Resolve API key by runtime
    const apiKey = isServer
        ? process.env.SECUREX_API_KEY
        : process.env.NEXT_PUBLIC_SECUREX_API_KEY;

    // HARD FAIL
    if (!apiKey) {
        const errorMsg = `CRITICAL: SECUREX_API_KEY is missing [${isServer ? 'SERVER' : 'CLIENT'}]! Request blocked.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Normalize endpoint
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let url = `${GATEWAY_BASE}${path}`;

    // Params support
    if (params && typeof params === "object") {
        const search = new URLSearchParams(params);
        url += (url.includes("?") ? "&" : "?") + search.toString();
    }

    // Gateway enforcement
    if (!url.startsWith(GATEWAY_BASE)) {
        throw new Error(
            `SECURITY VIOLATION: Attempted to bypass SecureX Gateway (${url})`
        );
    }

    const finalHeaders = {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        ...headers,
    };

    // Forward cookies (server-side only)
    if (isServer) {
        let cookieHeader = explicitCookies;

        // If no explicit cookies provided, try to get from next/headers
        if (!cookieHeader) {
            try {
                const { cookies } = require("next/headers");
                const cookieStore = cookies();
                cookieHeader = cookieStore
                    .getAll()
                    .map(c => `${c.name}=${c.value}`)
                    .join("; ");
            } catch (e) {
                // Not in a request context where cookies() is available
            }
        }

        if (cookieHeader) {
            finalHeaders["cookie"] = cookieHeader;
        }
    }

    const options = {
        method,
        headers: finalHeaders,
        cache: "no-store", // Production requirement: ensure metrics are fresh
    };

    if (body) {
        options.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    // Debug (log confirmation of routing)
    if (process.env.NODE_ENV !== "production") {
        console.log(`[SecureX Debug] [${isServer ? 'SERVER' : 'CLIENT'}] ${method} ${url} (x-api-key present)`);
    }

    const res = await fetch(url, options);

    if (!res.ok) {
        let errorData;
        const text = await res.text();
        try {
            errorData = JSON.parse(text);
        } catch {
            errorData = text;
        }

        const errorMsg = typeof errorData === 'object' ? (errorData.message || errorData.error || res.statusText) : errorData;
        console.warn(`SecureX Gateway Request Failed [${res.status}]: ${url} - ${errorMsg}`);
        throw new Error(`SecureX Gateway Error ${res.status}: ${errorMsg}`);
    }

    // Handle empty responses or non-json responses
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        try {
            return await res.text() || null;
        } catch {
            return null;
        }
    }

    return res.json();
}

// CJS Export for legacy scripts
if (typeof module !== "undefined" && module.exports) {
    module.exports = { gatewayClient };
}
