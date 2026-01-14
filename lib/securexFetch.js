import { headers, cookies } from "next/headers";

/**
 * Helper to fetch from the SecureX Gateway.
 * Automatically attaches the API Key and prepends the Gateway URL.
 * Handles JSON serialization and Content-Type automatically.
 * THIS MUST ONLY BE USED SERVER-SIDE.
 */
export async function securexFetch(endpoint, options = {}) {
    const gatewayUrl = process.env.SECUREX_GATEWAY_URL;
    const apiKey = process.env.SECUREX_API_KEY;

    if (!gatewayUrl || !apiKey) {
        throw new Error("SECUREX_GATEWAY_URL and SECUREX_API_KEY must be defined in environment variables.");
    }

    // Ensure endpoint starts with /
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${gatewayUrl}${path}`;

    // Normalize headers
    let requestHeaders = {
        "x-securex-api-key": apiKey,
    };

    // Merge options.headers
    if (options.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
                requestHeaders[key] = value;
            });
        } else {
            requestHeaders = { ...requestHeaders, ...options.headers };
        }
    }

    // Handle Body and Content-Type
    let body = options.body;

    if (body && typeof body === "object" && body.constructor === Object) {
        // It's a plain object, stringify it and set Content-Type
        body = JSON.stringify(body);
        requestHeaders["Content-Type"] = "application/json";
    } else if (body && typeof body === "string") {
        // It's a string, if it looks like JSON and no content type is set, arguably we could set it but safer to check headers
        // For now, trust the caller or if they passed a stringified body but forgot the header, we might want to help?
        // But the requirement says "Ensure Content-Type... is set only when appropriate".
        // If the caller stringified it, they likely want to send JSON.
    }

    // Forward authentication cookies (if present)
    // This is crucial for authenticated requests to the upstream
    try {
        const cookieStore = cookies();
        const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");
        if (allCookies) {
            requestHeaders["Cookie"] = allCookies;
        }
    } catch (err) {
        // cookies() might fail in some contexts (e.g., during static generation), ignore
        console.warn("[SecureX] Could not read cookies:", err.message);
    }

    const config = {
        ...options,
        headers: requestHeaders,
        body: body,
        credentials: "include", // Ensure we handle cookies properly
    };

    console.log(`[SecureX] Fetching: ${url}`);
    // Log request details for debugging
    if (process.env.NODE_ENV === "development") {
        console.log("Headers:", JSON.stringify(requestHeaders, null, 2));
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            let errorDetails = "";
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
                errorDetails = JSON.stringify(errorData);
            } catch (e) {
                errorMessage = `${errorMessage}: ${response.statusText}`;
            }
            console.error(`[SecureX] Error ${response.status}: ${errorMessage}`, errorDetails);
            throw new Error(errorMessage);
        }

        if (response.status === 204) {
            return {};
        }

        return await response.json();
    } catch (error) {
        console.error(`[SecureX] Exception: ${error.message}`);
        throw error;
    }
}
