import { cookies } from "next/headers";

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

    const url = `https://gateway.devlooper.co.in${path}`;

    const requestHeaders = { ...headers };

    // Attach SecureX API key
    requestHeaders["x-api-key"] = process.env.SECUREX_API_KEY;

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
