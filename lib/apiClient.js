export async function apiClient(endpoint, options = {}) {
    const {
        method = "GET",
        headers = {},
        body,
        params,
    } = options;

    // Standardize path
    let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    // Append query params if provided
    if (params && typeof params === "object") {
        const search = new URLSearchParams(params);
        path += (path.includes("?") ? "&" : "?") + search.toString();
    }

    const gatewayUrl = "https://gateway.devlooper.co.in";
    const url = `${gatewayUrl}${path}`;

    // Safeguard: Ensure the URL is actually targeting the gateway
    if (!url.startsWith(gatewayUrl)) {
        throw new Error(`Security Violation: Attempted to bypass SecureX Gateway. Target: ${url}`);
    }

    const requestHeaders = {
        ...headers,
        "x-api-key": process.env.NEXT_PUBLIC_SECUREX_API_KEY,
    };

    let requestBody = body;
    if (body && typeof body === "object" && body.constructor === Object) {
        requestBody = JSON.stringify(body);
        requestHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
    });

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        // Log warning for bypass attempts or failures
        console.warn(`SecureX Gateway Request Failed [${response.status}]: ${url}`);
        throw new Error(data?.message || `API request failed with status ${response.status}`);
    }

    return data;
}
