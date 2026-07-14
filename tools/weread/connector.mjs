import http from 'node:http';

const port = Number(process.env.PORT || 4173);
const gateway = 'https://i.weread.qq.com/api/agent/gateway';
const skillVersion = '1.0.4';
const trustedOrigin = 'https://kidlovec.github.io';
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
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.origin === trustedOrigin) return true;
    const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname.toLowerCase());
    return local && url.host.toLowerCase() === String(req.headers.host || '').toLowerCase();
  } catch {
    return false;
  }
}

function exposeToAllowedPage(req, res) {
  if (!req.headers.origin || !hasAllowedOrigin(req)) return;
  res.setHeader('access-control-allow-origin', req.headers.origin);
  res.setHeader('access-control-allow-private-network', 'true');
  res.setHeader('vary', 'Origin');
}

function preflight(req, res) {
  if (!hasAllowedOrigin(req)) return json(res, 403, { error: 'forbidden_origin' });
  exposeToAllowedPage(req, res);
  res.writeHead(204, {
    'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-max-age': '600',
    'cache-control': 'no-store'
  });
  res.end();
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
  } catch (error) {
    return json(res, 502, { error: 'gateway_failed', message: error.message || '微信读书数据获取失败' });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    exposeToAllowedPage(req, res);
    if (req.method === 'OPTIONS' && req.url?.startsWith('/api/')) return preflight(req, res);
    if (req.url?.startsWith('/api/') && !hasAllowedOrigin(req)) return json(res, 403, { error: 'forbidden_origin' });
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
  console.log('保持此终端窗口打开，然后返回 https://kidlovec.github.io/tools/weread/');
});
