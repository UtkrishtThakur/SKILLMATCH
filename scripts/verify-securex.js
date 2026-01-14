const { securexFetch } = require("../lib/securexFetch");

// Mock environment variables for testing purposes
// In a real run, these would need to be set or loaded from .env.local
process.env.SECUREX_GATEWAY_URL = "https://mock-gateway.example.com";
process.env.SECUREX_API_KEY = "mock-api-key";

// Mock global fetch
global.fetch = async (url, options) => {
    console.log(`\n[MockFetch] Request received:`);
    console.log(`  URL: ${url}`);
    console.log(`  Method: ${options.method || 'GET'}`);
    console.log(`  Headers:`, options.headers);
    if (options.body) {
        console.log(`  Body: ${options.body}`);
    }

    if (!url.startsWith(process.env.SECUREX_GATEWAY_URL)) {
        throw new Error("URL does not start with Gateway URL");
    }

    const headers = options.headers || {};
    if (headers["x-securex-api-key"] !== process.env.SECUREX_API_KEY) {
        throw new Error("Missing or incorrect x-securex-api-key header");
    }

    return {
        ok: true,
        status: 200,
        json: async () => ({ message: "Success from upstream" }),
    };
};

async function testSecurexFetch() {
    console.log("Testing securexFetch...");
    try {
        const result = await securexFetch("test-endpoint", {
            method: "POST",
            body: JSON.stringify({ foo: "bar" }),
        });
        console.log("\nResult:", result);
        console.log("\n✅ securexFetch verification passed!");
    } catch (error) {
        console.error("\n❌ securexFetch verification failed:", error);
    }
}

testSecurexFetch();
