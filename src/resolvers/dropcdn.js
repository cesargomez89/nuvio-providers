const { unpackPacker } = require('../utils/packer.js');
const { getSessionUA } = require('../utils/http.js');

async function resolve(url, signal = null) {
  try {
    const UA = getSessionUA();
    const domain = new URL(url).origin;

    const resp = await fetch(url, {
      signal,
      headers: {
        "User-Agent": UA,
        "Referer": domain,
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    if (!resp.ok) return null;
    const html = await resp.text();

    const unpacked = unpackPacker(html);
    if (!unpacked) {
      const directMatch = html.match(/file:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
      if (!directMatch) return null;
      return {
        url: directMatch[1],
        quality: "1080p",
        serverName: "DropCDN",
        headers: {
          "User-Agent": UA,
          "Referer": domain,
          "Origin": domain
        }
      };
    }

    const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    if (!fileMatch) return null;

    return {
      url: fileMatch[1],
      quality: "1080p",
      serverName: "DropCDN",
      headers: {
        "User-Agent": UA,
        "Referer": domain,
        "Origin": domain
      }
    };
  } catch (e) {
    console.error(`[DropCDN] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
