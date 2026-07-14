import http from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const gateway = 'https://i.weread.qq.com/api/agent/gateway';
const skillVersion = '1.0.4';
const trustedOrigin = 'https://kidlovec.github.io';
const allowedMethods = new Set(['GET', 'POST', 'DELETE']);
const allowedRequestHeaders = new Set(['content-type', 'x-weread-connector-token']);
const tokenPattern = /^[A-Za-z0-9_-]{43}$/;

function argumentValue(name) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function isLoopbackHostname(hostname) {
  const value = hostname.toLowerCase();
  return value === 'localhost' || value === '::1' || value === '[::1]'
    || value.endsWith('.localhost') || /^127(?:\.\d{1,3}){3}$/.test(value);
}

function normalizePublicUrl(value) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('--public-url 必须是完整的 HTTPS 地址'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('--public-url 只接受不含账号、路径、查询参数或片段的 HTTPS 地址');
  }
  if (isLoopbackHostname(url.hostname) || ['0.0.0.0', '::', '[::]'].includes(url.hostname.toLowerCase())) {
    throw new Error('--public-url 必须是手机可访问的非本机 HTTPS 地址');
  }
  return url.origin;
}

const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须是 1-65535 之间的整数');
const publicUrl = normalizePublicUrl(argumentValue('--public-url') || process.env.DUJI_PUBLIC_URL || '');
const remoteMode = Boolean(publicUrl);
const configuredToken = process.env.DUJI_CONNECTOR_TOKEN || '';
if (configuredToken && !tokenPattern.test(configuredToken)) {
  throw new Error('DUJI_CONNECTOR_TOKEN 必须是 32 字节 base64url 令牌（43 个字符）');
}
const connectorToken = remoteMode ? configuredToken || randomBytes(32).toString('base64url') : '';
let runtimeApiKey = process.env.WEREAD_API_KEY || '';

const allowedApis = new Set([
  '/shelf/sync', '/readdata/detail', '/user/notebooks',
  '/book/info', '/book/getprogress', '/book/chapterinfo',
  '/book/bookmarklist', '/book/bestbookmarks',
  '/review/list/mine', '/review/list'
]);

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64_000) throw new Error('payload_too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function acceptsJson(req) {
  return String(req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase() === 'application/json';
}

function hasAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return !remoteMode;
  try {
    const url = new URL(origin);
    if (url.origin === trustedOrigin) return true;
    const local = isLoopbackHostname(url.hostname);
    return !remoteMode && local && url.host.toLowerCase() === String(req.headers.host || '').toLowerCase();
  } catch {
    return false;
  }
}

function exposeToAllowedPage(req, res) {
  if (!req.headers.origin || !hasAllowedOrigin(req)) return;
  res.setHeader('access-control-allow-origin', req.headers.origin);
  res.setHeader('access-control-allow-private-network', 'true');
  res.setHeader('vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Request-Private-Network');
}

function preflight(req, res) {
  if (!hasAllowedOrigin(req)) return json(res, 403, { error: 'forbidden_origin', message: '不允许的页面来源' });
  const method = String(req.headers['access-control-request-method'] || '').toUpperCase();
  const headers = String(req.headers['access-control-request-headers'] || '')
    .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!allowedMethods.has(method) || headers.some(value => !allowedRequestHeaders.has(value))) {
    exposeToAllowedPage(req, res);
    return json(res, 403, { error: 'forbidden_preflight', message: '预检请求包含不允许的方法或请求头' });
  }
  exposeToAllowedPage(req, res);
  res.writeHead(204, {
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type, X-WeRead-Connector-Token',
    'access-control-max-age': '600',
    'cache-control': 'no-store'
  });
  res.end();
}

function tokenMatches(value) {
  if (!remoteMode || typeof value !== 'string' || value.length > 128) return !remoteMode;
  const expected = createHash('sha256').update(connectorToken).digest();
  const actual = createHash('sha256').update(value).digest();
  return timingSafeEqual(actual, expected) && tokenPattern.test(value);
}

async function configure(req, res) {
  if (!acceptsJson(req)) return json(res, 415, { error: 'unsupported_media_type', message: '请求必须使用 application/json' });
  try {
    const body = await readJson(req);
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    if (!/^wrk-[A-Za-z0-9_-]{20,}$/.test(apiKey)) {
      return json(res, 400, { error: 'invalid_key', message: 'API Key 格式不正确' });
    }
    runtimeApiKey = apiKey;
    return json(res, 200, { configured: true });
  } catch (error) {
    const tooLarge = error?.message === 'payload_too_large';
    return json(res, tooLarge ? 413 : 400, {
      error: tooLarge ? 'payload_too_large' : 'invalid_json',
      message: tooLarge ? '请求体过大' : '请求体不是有效的 JSON'
    });
  }
}

async function proxy(req, res) {
  if (!acceptsJson(req)) return json(res, 415, { error: 'unsupported_media_type', message: '请求必须使用 application/json' });
  const apiKey = runtimeApiKey;
  if (!apiKey) return json(res, 503, { error: 'missing_key', message: '尚未配置微信读书 API Key' });
  try {
    const body = await readJson(req);
    if (!allowedApis.has(body.api_name)) return json(res, 400, { error: 'unsupported_api', message: '不支持此接口' });
    const payload = { ...body, skill_version: skillVersion };
    delete payload.params;
    const upstream = await fetch(gateway, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000)
    });
    const data = await upstream.json();
    if (data.upgrade_info) return json(res, 426, { error: 'skill_upgrade_required', ...data.upgrade_info });
    return json(res, upstream.ok ? 200 : upstream.status, data);
  } catch {
    return json(res, 502, { error: 'gateway_failed', message: '微信读书数据获取失败' });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    exposeToAllowedPage(req, res);
    if (req.method === 'OPTIONS' && req.url?.startsWith('/api/')) return preflight(req, res);
    if (req.url?.startsWith('/api/') && !hasAllowedOrigin(req)) return json(res, 403, { error: 'forbidden_origin', message: '不允许的页面来源' });
    if (req.url?.startsWith('/api/') && !tokenMatches(req.headers['x-weread-connector-token'])) {
      return json(res, 401, { error: 'invalid_connector_token', message: '连接器访问令牌无效' });
    }
    if (req.method === 'GET' && req.url === '/api/status') return json(res, 200, { configured: Boolean(runtimeApiKey), skillVersion });
    if (req.method === 'POST' && req.url === '/api/config') return await configure(req, res);
    if (req.method === 'DELETE' && req.url === '/api/config') {
      runtimeApiKey = '';
      return json(res, 200, { configured: false });
    }
    if (req.method === 'POST' && req.url === '/api/weread') return await proxy(req, res);
    return json(res, 404, { error: 'not_found', message: '读迹连接器仅提供 /api/* 接口' });
  } catch {
    if (!res.headersSent) return json(res, 500, { error: 'internal_error' });
    if (!res.writableEnded) res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`读迹连接器已启动：http://127.0.0.1:${port}`);
  if (!remoteMode) {
    console.log('保持此终端窗口打开，然后返回 https://kidlovec.github.io/tools/weread/');
    return;
  }
  const mobilePage = new URL('https://kidlovec.github.io/tools/weread/');
  mobilePage.searchParams.set('autoload', '1');
  mobilePage.hash = new URLSearchParams({ connector: publicUrl }).toString();
  console.log(`私有 HTTPS 连接器：${publicUrl}`);
  console.log(`手机页面链接（可发到手机）：${mobilePage}`);
  console.log(`访问令牌（敏感，请单独粘贴）：${connectorToken}`);
  console.log('连接器仍只监听 127.0.0.1；请另行运行 tailscale serve --bg 4173，不要使用 Funnel。');
});
