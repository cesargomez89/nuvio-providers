const { getSessionUA } = require('../utils/http.js');

function decodeMixdropSource(html) {
  const rcdMatch = html.match(/["']([a-zA-Z0-9]+)["']\s*\+\s*["']([a-zA-Z0-9]+)["']/);
  if (rcdMatch) {
    return rcdMatch[1] + rcdMatch[2];
  }
  const srcMatch = html.match(/src\s*:\s*["']([^"']+)["']/i);
  if (srcMatch) return srcMatch[1];
  return null;
}

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    const resp = await fetch(url, {
      signal,
      headers: {
        'User-Agent': UA,
        Referer: 'https://m1xdrop.click/',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    const videoUrl = decodeMixdropSource(html);
    if (!videoUrl) return null;

    return {
      url: videoUrl,
      quality: '1080p',
      serverName: 'Mixdrop',
      headers: {
        'User-Agent': UA,
        Referer: 'https://m1xdrop.click/',
        Origin: 'https://m1xdrop.click',
      },
    };
  } catch (e) {
    console.error(`[Mixdrop] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
