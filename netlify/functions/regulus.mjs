// This module is deployed as a server function, never served from dist/.
const routes = {
  '/api/accounts': ['GET'],
  '/api/asset': ['GET'],
  '/api/account/edit': ['POST', 'PATCH', 'DELETE'],
  '/api/cash': ['POST'],
  '/api/trade': ['POST'],
  '/api/stock': ['POST'],
};
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const fail = (status, error) => new Response(JSON.stringify({ error }), { status, headers });
export function proxyOrigin(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    return url.origin;
  } catch { throw new Error('REGULUS_PROXY_TARGET must be an HTTP(S) origin without credentials, path, query or fragment.'); }
}
export default async function handler(request) {
  const incoming = new URL(request.url);
  const allowed = routes[incoming.pathname];
  if (!allowed) return fail(404, 'API route not available.');
  if (!allowed.includes(request.method)) return fail(405, 'Method not allowed.');
  let origin;
  try { origin = proxyOrigin(process.env.REGULUS_PROXY_TARGET); }
  catch { return fail(503, 'API proxy is not configured for this deployment.'); }
  try {
    const body = ['POST', 'PATCH'].includes(request.method) ? await request.text() : undefined;
    if (body && Buffer.byteLength(body) > 1024 * 1024) return fail(413, 'Request too large.');
    if (body !== undefined) {
      if (!request.headers.get('content-type')?.includes('application/json')) return fail(415, 'Content-Type must be application/json.');
      try { JSON.parse(body); } catch { return fail(400, 'Invalid JSON request.'); }
    }
    const upstream = new URL(incoming.pathname, origin);
    // Only the supported query parameters may pass; callers cannot override the host.
    for (const key of ['firmId', 'accountId', 'processDate']) {
      if (incoming.searchParams.has(key)) upstream.searchParams.set(key, incoming.searchParams.get(key));
    }
    const response = await fetch(upstream, {
      method: request.method, body,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      redirect: 'manual', signal: AbortSignal.timeout(20000),
    });
    // Never forward upstream redirects, cookies, server headers or error pages.
    if (!response.ok) {
      const status = response.status >= 400 && response.status <= 599 ? response.status : 502;
      const messages = { 400: 'API rejected the request.', 401: 'API authentication required.', 403: 'API access denied.', 404: 'Account or book not found.', 409: 'Request conflicts with existing account or book data.' };
      return fail(status, messages[status] || 'API request failed. Refresh and reconcile writes before retrying.');
    }
    const data = await response.json();
    // Defense against an upstream JSON response reflecting its server address.
    let json = JSON.stringify(data);
    for (const value of [origin, new URL(origin).host, new URL(origin).hostname]) json = json.split(value).join('[upstream]');
    return new Response(json, { status: response.status, headers });
  } catch {
    return fail(502, 'API request interrupted. Refresh and reconcile writes before retrying.');
  }
}
export const config = { path: '/api/*' };
