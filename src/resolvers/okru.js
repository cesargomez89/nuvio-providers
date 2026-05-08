const { getSessionUA } = require('../utils/http.js');

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    const resp = await fetch(url, {
      signal,
      headers: {
        'User-Agent': UA,
        Referer: 'https://ok.ru/',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    // Pattern 1: data-* attributes on video player
    const dataSrcMatch = html.match(/data-src\s*=\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (dataSrcMatch) {
      return {
        url: dataSrcMatch[1],
        quality: '1080p',
        serverName: 'OKru',
        headers: { 'User-Agent': UA, Referer: url },
      };
    }

    // Pattern 2: metadata with video URL
    const metaMatch = html.match(/video_url["']\s*:\s*["']([^"']+)["']/i);
    if (metaMatch) {
      return {
        url: metaMatch[1],
        quality: '1080p',
        serverName: 'OKru',
        headers: { 'User-Agent': UA, Referer: url },
      };
    }

    // Pattern 3: JSON-LD with contentUrl
    const jsonldMatch = html.match(/contentUrl["']\s*:\s*["']([^"']+)["']/i);
    if (jsonldMatch) {
      return {
        url: jsonldMatch[1],
        quality: '1080p',
        serverName: 'OKru',
        headers: { 'User-Agent': UA, Referer: url },
      };
    }

    return null;
  } catch (e) {
    console.error(`[OKru] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
