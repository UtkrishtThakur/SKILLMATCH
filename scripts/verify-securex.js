const { securexFetch } = require("../lib/securexFetch");

// Mock environment variables for testing purposes
process.env.SECUREX_GATEWAY_URL = "https://mock-gateway.example.com";
process.env.SECUREX_API_KEY = "mock-api-key";

// Mock global fetch
global.fetch = async (url, options) => {
    console.log(`\n[MockFetch] Request received:`);
    console.log(`  URL: ${url}`);
    console.log(`  Method: ${options.method || 'GET'}`);
    console.log(`  Headers:`, options.headers);
    if (options.body) {
        console.log(`  Body Type: ${typeof options.body}`);
        console.log(`  Body Content: ${options.body}`);
    }

    if (!url.startsWith(process.env.SECUREX_GATEWAY_URL)) {
        throw new Error("URL does not start with Gateway URL");
    }

    const headers = options.headers || {};
    if (headers["x-securex-api-key"] !== process.env.SECUREX_API_KEY) {
        throw new Error("Missing or incorrect x-securex-api-key header");
    }

    // Check Content-Type for POST
    if (options.method === "POST" && headers["Content-Type"] !== "application/json") {
        console.error("❌ Content-Type mismatch! Expected application/json");
        throw new Error("Invalid Content-Type");
    }

    return {
        ok: true,
        status: 200,
        json: async () => ({ message: "Success from upstream" }),
    };
};

async function testSecurexFetch() {
    console.log("Testing securexFetch with Object Body...");
    try {
        // Pass object directly!
        const result = await securexFetch("test-endpoint", {
            method: "POST",
            body: { foo: "bar", nested: true },
        });
        console.log("\nResult:", result);
        console.log("\n✅ securexFetch verification passed!");
    } catch (error) {
        console.error("\n❌ securexFetch verification failed:", error);
    }
}

testSecurexFetch();
