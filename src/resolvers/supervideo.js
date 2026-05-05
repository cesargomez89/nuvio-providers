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
        "User-Agent": UA,
        "Referer": url
      }
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    const unpacked = unpackPacker(html);
    if (!unpacked) return null;

    const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+?\.m3u8[^"']*)["']/i);
    if (!fileMatch) return null;

    const streamUrl = fileMatch[1];

    const headers = {
      ...getStealthHeaders(),
      "Referer": url.split("?")[0],
      "Origin": new URL(url).origin,
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": UA
    };

    const streamObj = { url: streamUrl, headers };
    const validation = await validateStream(streamObj, signal);

    return {
      url: streamUrl,
      quality: validation?.quality || "1080p",
      verified: validation?.verified ?? true,
      isReal: validation?.isReal ?? false,
      serverName: "Supervideo",
      headers
    };
  } catch (e) {
    console.error(`[Supervideo] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
