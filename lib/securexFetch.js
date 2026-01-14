/**
 * Helper to fetch from the SecureX Gateway.
 * Automatically attaches the API Key and prepends the Gateway URL.
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

    const defaultHeaders = {
        "x-securex-api-key": apiKey,
        "Content-Type": "application/json",
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    console.log(`[SecureX] Fetching: ${url}`);

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            // Try to parse error message from JSON response
            let errorMessage = `Request failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Response was not JSON, use status text
                if (response.statusText) {
                    errorMessage = `${errorMessage}: ${response.statusText}`;
                }
            }
            throw new Error(errorMessage);
        }

        // Return empty object for 204 No Content, otherwise parse JSON
        if (response.status === 204) {
            return {};
        }

        return await response.json();
    } catch (error) {
        console.error(`[SecureX] Request failed: ${error.message}`);
        throw error;
    }
}
