const { gatewayClient } = require("../lib/gatewayClient");

// Usage: node scripts/smoke_connect_test.js <token> <userId>
// Note: baseUrl is no longer needed as it is hardcoded in the client.
// NEXT_PUBLIC_SECUREX_API_KEY must be set in env.

const [, , token, userId] = process.argv;

if (!token || !userId) {
  console.error('Usage: node scripts/smoke_connect_test.js <token> <userId>');
  console.error('Ensure NEXT_PUBLIC_SECUREX_API_KEY is set in your environment.');
  process.exit(2);
}

(async () => {
  try {
    console.log(`Starting smoke test for User: ${userId}`);

    const data = await gatewayClient(`/api/connect/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('✅ Request successful');
    console.log('Body sample keys:', Object.keys(data).slice(0, 10));

    // Basic shape checks
    if (!Array.isArray(data.received) || !Array.isArray(data.sent) || !Array.isArray(data.accepted)) {
      console.error('❌ Expected received/sent/accepted arrays in response');
      console.dir(data, { depth: 3 });
      process.exit(1);
    }

    console.log('✅ Response validation passed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Smoke test failed:', err.message);
    process.exit(3);
  }
})();
