const { getSessionUA, getStealthHeaders } = require('../utils/http.js');
const { unpackPacker } = require('../utils/packer.js');
const { validateStream } = require('../utils/m3u8.js');

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    console.log(`[Supervideo] Resolving: ${url}`);

    const resp = await fetch(url, {
      signal,
      headers: {
        ...getStealthHeaders(),
        Referer: new URL(url).origin + '/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-US,es;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    if (!resp.ok) {
      console.log(`[Supervideo] HTTP ${resp.status}: headers insufficient`);
      return null;
    }

    const html = await resp.text();
    const unpacked = unpackPacker(html);
    if (!unpacked) {
      const directFile = html.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
      if (directFile) {
        const streamUrl = directFile[1];
        const headers = {
          ...getStealthHeaders(),
          Referer: url.split('?')[0],
          Origin: new URL(url).origin,
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': UA,
        };
        const streamObj = { url: streamUrl, headers };
        const validation = await validateStream(streamObj, signal);
        return {
          url: streamUrl,
          quality: validation?.quality || '1080p',
          verified: validation?.verified ?? true,
          isReal: validation?.isReal ?? false,
          serverName: 'Supervideo',
          headers,
        };
      }
      return null;
    }

    const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+?\.m3u8[^"']*)["']/i);
    if (!fileMatch) return null;

    const streamUrl = fileMatch[1];
    const headers = {
      ...getStealthHeaders(),
      Referer: url.split('?')[0],
      Origin: new URL(url).origin,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': UA,
    };
    const streamObj = { url: streamUrl, headers };
    const validation = await validateStream(streamObj, signal);

    return {
      url: streamUrl,
      quality: validation?.quality || '1080p',
      verified: validation?.verified ?? true,
      isReal: validation?.isReal ?? false,
      serverName: 'Supervideo',
      headers,
    };
  } catch (e) {
    console.error(`[Supervideo] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
