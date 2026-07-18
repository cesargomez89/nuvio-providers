/**
 * HTTP Client
 * Reusable fetch helpers for provider requests.
 */
const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const COMMON_HEADERS = {
  'User-Agent': DEFAULT_UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    headers: { ...COMMON_HEADERS, ...options.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return await response.text();
}

export async function fetchJson(url, options = {}) {
  const raw = await fetchText(url, options);
  return JSON.parse(raw);
}

export async function fetchHtml(url, referer) {
  const headers = { ...COMMON_HEADERS };
  if (referer) headers['Referer'] = referer;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
  return await response.text();
}
