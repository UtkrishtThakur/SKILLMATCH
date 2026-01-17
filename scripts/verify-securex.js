const { gatewayClient } = require("../lib/gateway_client");

// Mock environment variables for testing purposes
process.env.NEXT_PUBLIC_SECUREX_API_KEY = "mock-api-key";

// Mock global fetch
global.fetch = async (url, options) => {
    console.log(`\n[MockFetch] Request received:`);
    console.log(`  URL: ${url}`);
    console.log(`  Method: ${options.method || 'GET'}`);
    console.log(`  Headers:`, options.headers);
    if (options.body) {
        console.log(`  Body Content: ${options.body}`);
    }

    const gatewayUrl = "https://gateway.devlooper.co.in";
    if (!url.startsWith(gatewayUrl)) {
        throw new Error(`Security Violation: URL does not start with ${gatewayUrl}`);
    }

    const headers = options.headers || {};
    if (headers["x-api-key"] !== process.env.NEXT_PUBLIC_SECUREX_API_KEY) {
        throw new Error("Missing or incorrect x-api-key header");
    }

    return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ message: "Success from upstream" }),
    };
};

async function runVerification() {
    console.log("Verifying gatewayClient with Mock...");
    try {
        const result = await gatewayClient("test-endpoint", {
            method: "POST",
            body: { foo: "bar", nested: true },
        });
        console.log("\nResult:", result);
        console.log("\n✅ gatewayClient verification passed!");
    } catch (error) {
        console.error("\n❌ gatewayClient verification failed:", error);
        process.exit(1);
    }
}

runVerification();
