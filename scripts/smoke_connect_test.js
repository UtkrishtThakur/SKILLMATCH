const fetch = require('node-fetch');

// Small smoke test for GET /api/connect/[id]
// Usage: node scripts/smoke_connect_test.js <baseUrl> <userToken> <userId>

const [,, baseUrl, token, userId] = process.argv;

if (!baseUrl || !token || !userId) {
  console.error('Usage: node scripts/smoke_connect_test.js <baseUrl> <token> <userId>');
  process.exit(2);
}

(async () => {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/connect/${userId}`;
    console.log('GET', url);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Body sample keys:', Object.keys(data).slice(0, 10));

    // Basic shape checks
    if (!Array.isArray(data.received) || !Array.isArray(data.sent) || !Array.isArray(data.accepted)) {
      console.error('❌ Expected received/sent/accepted arrays in response');
      console.dir(data, { depth: 3 });
      process.exit(1);
    }

    console.log('✅ Response contains received/sent/accepted arrays');

    const sample = {
      received: data.received[0] || null,
      sent: data.sent[0] || null,
      accepted: data.accepted[0] || null,
    };

    console.log('Sample item shapes (null means none present):');
    console.dir(sample, { depth: 2 });

    // Validate fields on sample if present
    const checkUserSummary = (u) => u && u.user && u.user.id && u.user.name && u.user.email;

    if (sample.received && !checkUserSummary(sample.received)) console.warn('received item shape might be wrong');
    if (sample.sent && !checkUserSummary(sample.sent)) console.warn('sent item shape might be wrong');
    if (sample.accepted && !checkUserSummary(sample.accepted)) console.warn('accepted item shape might be wrong');

    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(3);
  }
})();
