export function parseStatCount(stats, name) {
  const item = stats?.readStat?.find(entry => entry.stat === name);
  if (item?.counts == null) return null;
  const raw = String(item.counts).replaceAll(',', '').trim();
  const match = raw.match(/-?[\d.]+/);
  if (!match) return null;
  let value = Number(match[0]);
  if (!Number.isFinite(value)) return null;
  if (raw.includes('亿')) value *= 100_000_000;
  else if (raw.includes('万')) value *= 10_000;
  return Math.round(value);
}

export function clampProgress(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
}

export function normalizeReadingItem(entry = {}) {
  const source = entry.book || entry.albumInfo || entry;
  const bookId = source.bookId || entry.bookId || '';
  const albumId = source.albumId || entry.albumId || '';
  return {
    id: bookId || albumId,
    bookId,
    albumId,
    title: source.title || source.name || '未命名读物',
    author: source.author || source.authorName || '',
    cover: source.cover || '',
    category: source.category || (albumId ? '有声书' : '未分类'),
  };
}
