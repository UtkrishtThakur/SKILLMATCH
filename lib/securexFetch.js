import { cookies } from "next/headers";

if (!options?.params?.request) {
    throw new Error(
        `❌ Missing required query param 'request' for endpoint: ${endpoint}`
    );
}


export async function securexFetch(endpoint, options = {}) {
    const {
        method = "GET",
        headers = {},
        body,
        params,
    } = options;

    let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    if (params && typeof params === "object") {
        const search = new URLSearchParams(params);
        path += `?${search.toString()}`;
    }

    const url = `${process.env.SECUREX_GATEWAY_URL}${path}`;

    const requestHeaders = { ...headers };

    // Attach SecureX API key
    requestHeaders["x-securex-api-key"] = process.env.SECUREX_API_KEY;

    // Forward cookies for auth/session flows
    const cookieStore = cookies();
    const cookieHeader = cookieStore
        .getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    if (cookieHeader) {
        requestHeaders["Cookie"] = cookieHeader;
    }

    let requestBody = body;

    if (
        body &&
        typeof body === "object" &&
        body.constructor === Object
    ) {
        requestBody = JSON.stringify(body);
        requestHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials: "include",
    });

    const text = await res.text();
    let data;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        throw new Error(`SecureX request failed (${res.status}): ${JSON.stringify(data)}`);
    }

    return data;
}
