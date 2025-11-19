/**
 * Minimal Genesys Cloud Callback proxy for EU Central (Frankfurt).
 * Node.js 18+
 */
import 'dotenv/config';
import express from 'express';

const REGION_API = process.env.GC_REGION_API || 'https://api.mypurecloud.de';
const REGION_LOGIN = process.env.GC_REGION_LOGIN || 'https://login.mypurecloud.de';
const CLIENT_ID = process.env.GC_CLIENT_ID;
const CLIENT_SECRET = process.env.GC_CLIENT_SECRET;
const PORT = process.env.PORT || 3000;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GC_CLIENT_ID or GC_CLIENT_SECRET env vars.');
  process.exit(1);
}

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < tokenExpiry - 60) return cachedToken;
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${REGION_LOGIN}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!resp.ok) throw new Error(`Token error ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  cachedToken = data.access_token;
  tokenExpiry = now + (data.expires_in || 3600);
  return cachedToken;
}

const app = express();
app.use(express.json());
app.use(express.static('.'));

app.post('/api/callback', async (req, res) => {
  try {
    const token = await getToken();
    const gcResp = await fetch(`${REGION_API}/api/v2/conversations/callbacks`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await gcResp.text();
    res.status(gcResp.status).send(text);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Callback creation failed', detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Call Me Now proxy running on http://localhost:${PORT}`);
});
