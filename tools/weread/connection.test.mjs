import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createConnectionProfile,
  normalizeConnectorBase,
  readConnectorPairing
} from './connection-model.js';

const trustedOrigin = 'https://kidlovec.github.io';
const connectorPath = fileURLToPath(new URL('./connector.mjs', import.meta.url));

function pairingHash(connector, extra = {}) {
  return `#${new URLSearchParams({ connector, ...extra })}`;
}

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function startConnector({ remote = false, token = '', apiKey = '' } = {}) {
  const port = await freePort();
  const args = [connectorPath];
  if (remote) args.push('--public-url=https://reader.example.ts.net');
  const child = spawn(process.execPath, args, {
    env: {
      ...process.env,
      PORT: String(port),
      WEREAD_API_KEY: apiKey,
      DUJI_CONNECTOR_TOKEN: token
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
  const started = (async () => {
    while (!stdout.includes('读迹连接器已启动')) {
      if (child.exitCode !== null) throw new Error(`connector exited early: ${stderr}`);
      await delay(20);
    }
  })();
  await Promise.race([started, delay(4000).then(() => { throw new Error(`connector startup timed out: ${stderr}`); })]);
  return {
    base: `http://127.0.0.1:${port}`,
    output: () => ({ stdout, stderr }),
    async stop() {
      if (child.exitCode !== null) return;
      child.kill('SIGTERM');
      await Promise.race([
        new Promise(resolve => child.once('exit', resolve)),
        delay(1000).then(() => child.kill('SIGKILL'))
      ]);
    }
  };
}

function requestHeaders(token = '') {
  return {
    Origin: trustedOrigin,
    ...(token ? { 'X-WeRead-Connector-Token': token } : {})
  };
}

test('connection model keeps desktop loopback and blocks it on phones', () => {
  const desktop = createConnectionProfile({ defaultBase: 'http://127.0.0.1:4173', userAgent: 'Mozilla/5.0 (Macintosh)' });
  assert.equal(desktop.loopback, true);
  assert.equal(desktop.mobileLoopbackUnsupported, false);

  for (const base of ['http://127.0.0.1:4173', 'http://127.0.0.2:4173', 'https://reader.localhost', 'http://[::1]:4173']) {
    const mobile = createConnectionProfile({ defaultBase: base, userAgent: 'Mozilla/5.0 (iPhone; Mobile)' });
    assert.equal(mobile.mobileLoopbackUnsupported, true, base);
  }
});

test('pairing accepts only a non-loopback HTTPS origin and never accepts a token in the URL', () => {
  const valid = readConnectorPairing(pairingHash('https://reader.example.ts.net'));
  assert.deepEqual(valid, { attempted: true, base: 'https://reader.example.ts.net', token: '', error: '' });
  const profile = createConnectionProfile({ pairing: valid, userAgent: 'Mozilla/5.0 (iPhone; Mobile)' });
  assert.equal(profile.remote, true);
  assert.equal(profile.loopback, false);
  assert.equal(profile.targetHost, 'reader.example.ts.net');

  for (const value of [
    'http://reader.example.ts.net',
    'https://user@reader.example.ts.net',
    'https://reader.example.ts.net/path',
    'https://reader.example.ts.net/?query=1',
    'https://127.0.0.2',
    'https://foo.localhost',
    'https://0.0.0.0'
  ]) assert.ok(readConnectorPairing(pairingHash(value)).error, value);

  const leaked = readConnectorPairing(pairingHash('https://reader.example.ts.net', { token: 'A'.repeat(43) }));
  assert.match(leaked.error, /不含 token/);
  assert.deepEqual(readConnectorPairing('#annual'), { attempted: false, base: '', token: '', error: '' });
  assert.equal(normalizeConnectorBase('javascript:alert(1)', { paired: true }), '');
});

test('legacy connector remains tokenless and never echoes the WeRead key', async () => {
  const connector = await startConnector();
  const key = `wrk-${'K'.repeat(24)}`;
  try {
    let response = await fetch(`${connector.base}/api/status`, { headers: requestHeaders() });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).configured, false);

    response = await fetch(`${connector.base}/api/config`, {
      method: 'POST',
      headers: { ...requestHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key })
    });
    assert.equal(response.status, 200);
    assert.equal((await response.text()).includes(key), false);

    response = await fetch(`${connector.base}/api/status`, { headers: requestHeaders() });
    assert.equal((await response.json()).configured, true);
    response = await fetch(`${connector.base}/api/config`, { method: 'DELETE', headers: requestHeaders() });
    assert.equal(response.status, 200);
    assert.equal((await response.text()).includes(key), false);
  } finally {
    await connector.stop();
  }
});

test('private HTTPS mode requires exact Origin plus a 256-bit token on every API route', async () => {
  const token = 'A'.repeat(43);
  const key = `wrk-${'K'.repeat(24)}`;
  const connector = await startConnector({ remote: true, token, apiKey: key });
  try {
    let response = await fetch(`${connector.base}/api/status`, {
      method: 'OPTIONS',
      headers: {
        Origin: trustedOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'x-weread-connector-token'
      }
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), trustedOrigin);
    assert.match(response.headers.get('access-control-allow-headers'), /X-WeRead-Connector-Token/i);
    assert.match(response.headers.get('vary'), /Access-Control-Request-Headers/);

    response = await fetch(`${connector.base}/api/status`, {
      method: 'OPTIONS',
      headers: {
        Origin: trustedOrigin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'x-weread-connector-token, x-evil'
      }
    });
    assert.equal(response.status, 403);

    for (const headers of [
      {},
      { Origin: trustedOrigin },
      requestHeaders('wrong'),
      requestHeaders('B'.repeat(43)),
      requestHeaders(`${token},${token}`)
    ]) {
      response = await fetch(`${connector.base}/api/status`, { headers });
      assert.ok([401, 403].includes(response.status), JSON.stringify(headers));
      const text = await response.text();
      assert.equal(text.includes(token), false);
      assert.equal(text.includes(key), false);
    }

    response = await fetch(`${connector.base}/api/status`, { headers: requestHeaders(token) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), trustedOrigin);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const statusText = await response.text();
    assert.equal(JSON.parse(statusText).configured, true);
    assert.equal(statusText.includes(token), false);
    assert.equal(statusText.includes(key), false);

    response = await fetch(`${connector.base}/api/status`, { headers: { Origin: 'https://evil.example', 'X-WeRead-Connector-Token': token } });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);

    response = await fetch(`${connector.base}/api/config`, { method: 'DELETE', headers: requestHeaders('B'.repeat(43)) });
    assert.equal(response.status, 401);
    response = await fetch(`${connector.base}/api/status`, { headers: requestHeaders(token) });
    assert.equal((await response.json()).configured, true);

    response = await fetch(`${connector.base}/api/status?token=${token}`, { headers: { Origin: trustedOrigin } });
    assert.equal(response.status, 401);

    response = await fetch(`${connector.base}/api/config`, {
      method: 'POST',
      headers: requestHeaders(token),
      body: JSON.stringify({ apiKey: key })
    });
    assert.equal(response.status, 415);
    assert.equal(response.headers.get('access-control-allow-origin'), trustedOrigin);

    response = await fetch(`${connector.base}/api/config`, { method: 'DELETE', headers: requestHeaders(token) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).configured, false);

    const { stdout, stderr } = connector.output();
    assert.equal(stderr, '');
    const pageLine = stdout.split('\n').find(line => line.includes('手机页面链接')) || '';
    assert.match(pageLine, /#connector=/);
    assert.equal(pageLine.includes('token='), false);
    assert.equal(pageLine.includes(token), false);
    assert.equal(stdout.includes(key), false);
  } finally {
    await connector.stop();
  }
});
