export async function gatewayClient(endpoint, options = {}) {
    const {
        method = "GET",
        headers = {},
        body,
        params,
    } = options;

    const isServer = typeof window === "undefined";
    const apiKey = isServer ? process.env.SECUREX_API_KEY : process.env.NEXT_PUBLIC_SECUREX_API_KEY;

    // HARD FAIL protection
    if (!apiKey) {
        const errorMsg = `CRITICAL: SECUREX_API_KEY is missing [${isServer ? 'SERVER' : 'CLIENT'}]! Request blocked.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    // Standardize path
    let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    // Append query params if provided
    if (params && typeof params === "object") {
        const search = new URLSearchParams(params);
        path += (path.includes("?") ? "&" : "?") + search.toString();
    }

    const gatewayUrl = "https://gateway.devlooper.co.in";
    const url = `${gatewayUrl}${path}`;

    // STRICT CONSTRAINTS: Gateway URL used?
    if (!url.startsWith(gatewayUrl)) {
        const violationMsg = `Security Violation: Attempted to bypass SecureX Gateway. Target: ${url}`;
        console.error(violationMsg);
        throw new Error(violationMsg);
    }

    const requestHeaders = {
        ...headers,
        "x-api-key": apiKey,
    };

    // Server-side: Forward cookies if available
    if (isServer) {
        try {
            const { cookies } = require("next/headers");
            const cookieStore = cookies();
            const cookieHeader = cookieStore
                .getAll()
                .map(c => `${c.name}=${c.value}`)
                .join("; ");

            if (cookieHeader) {
                requestHeaders["Cookie"] = cookieHeader;
            }
        } catch (e) {
            // cookies() might not be available in all server contexts (e.g. edge without request)
            // but for user-facing traffic in Next.js it usually is.
        }
    }

    let requestBody = body;
    if (body && typeof body === "object" && body.constructor === Object) {
        requestBody = JSON.stringify(body);
        requestHeaders["Content-Type"] = "application/json";
    } else if (body && typeof body === "string") {
        // Ensure Content-Type is set for strings too if it looks like JSON
        if (!requestHeaders["Content-Type"] && (body.startsWith("{") || body.startsWith("["))) {
            requestHeaders["Content-Type"] = "application/json";
        }
    }

    // Debug log to confirm routing
    console.log(`[SecureX Debug] [${isServer ? 'SERVER' : 'CLIENT'}] Routing to: ${url} (x-api-key present)`);

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        // credentials: "include" // Important for client-side cookie sending
    });

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        console.warn(`SecureX Gateway Request Failed [${response.status}]: ${url}`);
        throw new Error(data?.message || `API request failed with status ${response.status}`);
    }

    return data;
}

// CJS Export for scripts
if (typeof module !== "undefined" && module.exports) {
    module.exports = { gatewayClient };
}
