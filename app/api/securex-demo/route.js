import { NextResponse } from "next/server";
import { securexFetch } from "../../../lib/securexFetch";

/**
 * Example Route Handler demonstrating use of SecureX helper.
 * This proxies a request to the upstream /health endpoint (or similar).
 */
export async function GET(req) {
    try {
        // Example: Fetching some data from the secure gateway
        // In a real scenario, this might be a webhook handler or a proxy for a specific resource
        const data = await securexFetch("health");

        return NextResponse.json({
            status: "ok",
            gateway_response: data,
            message: "Successfully routed through SecureX"
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
