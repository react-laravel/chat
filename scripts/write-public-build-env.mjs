import fs from 'node:fs';
const raw = process.env.B_CHAT_WEB_PUBLIC_BUILD_ENV;
if (!raw) throw Error('The approved public frontend build settings are missing');
const values = JSON.parse(raw);
const allowed = new Set(['CHAT_API_ORIGIN', 'NEXT_PUBLIC_ACCOUNT_URL', 'NEXT_PUBLIC_REVERB_APP_KEY', 'NEXT_PUBLIC_REVERB_HOST', 'NEXT_PUBLIC_REVERB_PORT', 'NEXT_PUBLIC_REVERB_SCHEME']);
if (!values || Array.isArray(values) || typeof values !== 'object' || Object.keys(values).length !== allowed.size) throw Error('Unexpected public build setting shape');
for (const [key, value] of Object.entries(values)) {
  if (!allowed.has(key) || typeof value !== 'string' || /[\x00-\x1f\x7f]/.test(value)) throw Error('Invalid public build setting');
}
if (values.CHAT_API_ORIGIN !== 'http://127.0.0.1:8013' || values.NEXT_PUBLIC_ACCOUNT_URL !== 'https://next.dogeow.com') throw Error('Incorrect API or account origin');
if (values.NEXT_PUBLIC_REVERB_HOST !== 'chat-ws.dogeow.com' || values.NEXT_PUBLIC_REVERB_PORT !== '443' || values.NEXT_PUBLIC_REVERB_SCHEME !== 'https') throw Error('Incorrect public WebSocket settings');
if (!/^[A-Za-z0-9_-]{1,128}$/.test(values.NEXT_PUBLIC_REVERB_APP_KEY)) throw Error('Invalid public WebSocket app key');
fs.writeFileSync('.env.production.local', Object.entries(values).map(([key, value]) => key + '=' + JSON.stringify(value)).join('\n') + '\n', { mode: 0o600 });
console.log('The six explicitly approved public build settings were loaded.');
