const LOOPBACK_HOSTS = new Set(['localhost', '::1', '[::1]']);
const UNSPECIFIED_HOSTS = new Set(['0.0.0.0', '::', '[::]']);

function parseUrl(value) {
  try {
    return new URL(String(value || '').trim());
  } catch {
    return null;
  }
}

export function isLoopbackConnector(value) {
  const url = parseUrl(value);
  if (!url) return false;
  const hostname = url.hostname.toLowerCase();
  return LOOPBACK_HOSTS.has(hostname)
    || hostname.endsWith('.localhost')
    || /^127(?:\.\d{1,3}){3}$/.test(hostname);
}

export function normalizeConnectorBase(value, { paired = false } = {}) {
  const url = parseUrl(value);
  if (!url || url.username || url.password || url.search || url.hash || url.pathname !== '/') return '';
  const hostname = url.hostname.toLowerCase();
  const loopback = isLoopbackConnector(url.origin);
  if (UNSPECIFIED_HOSTS.has(hostname)) return '';
  if (paired && (url.protocol !== 'https:' || loopback)) return '';
  if (!paired && url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) return '';
  return url.origin;
}

export function readConnectorPairing(hash = '') {
  const raw = String(hash).replace(/^#/, '');
  const params = new URLSearchParams(raw);
  const attempted = params.has('connector') || params.has('token');
  if (!attempted) return { attempted: false, base: '', token: '', error: '' };

  const base = normalizeConnectorBase(params.get('connector'), { paired: true });
  if (params.has('token')) {
    return { attempted: true, base: '', token: '', error: '为避免访问令牌进入浏览器历史，请使用不含 token 的新配对链接。' };
  }
  if (!base) {
    return { attempted: true, base: '', token: '', error: '配对链接中的连接器地址无效，必须是非本机的 HTTPS 地址。' };
  }
  return { attempted: true, base, token: '', error: '' };
}

export function isMobileDevice({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
    || (platform === 'MacIntel' && Number(maxTouchPoints) > 1);
}

export function createConnectionProfile({
  defaultBase = '',
  pairing = { attempted: false, base: '', token: '', error: '' },
  userAgent = '',
  platform = '',
  maxTouchPoints = 0
} = {}) {
  const fallbackBase = normalizeConnectorBase(defaultBase);
  const base = pairing.base || fallbackBase;
  const mobile = isMobileDevice({ userAgent, platform, maxTouchPoints });
  const loopback = isLoopbackConnector(base);
  const remote = Boolean(base && !loopback);
  let targetHost = '';
  try { targetHost = base ? new URL(base).host : ''; } catch { /* invalid fallback already becomes empty */ }
  return {
    base,
    token: pairing.token || '',
    pairingAttempted: Boolean(pairing.attempted),
    pairingError: pairing.error || '',
    mobile,
    loopback,
    remote,
    mobileLoopbackUnsupported: Boolean(mobile && loopback),
    targetHost
  };
}
