const { getSessionUA, getStealthHeaders } = require('../utils/http.js');
const { validateStream } = require('../utils/m3u8.js');

function unpackVidHide(script) {
  try {
    const match = script.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
    if (!match)
      return null;
    let [full, p, a, c, k] = match;
    a = parseInt(a);
    c = parseInt(c);
    k = k.split("|");
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    const decode = (l, s) => {
      let res = "";
      while (l > 0) {
        res = chars[l % s] + res;
        l = Math.floor(l / s);
      }
      return res || "0";
    };
    const unpacked = p.replace(/\b\w+\b/g, (l) => {
      const s = parseInt(l, 36);
      return s < k.length && k[s] ? k[s] : decode(s, a);
    });
    return unpacked;
  } catch (e) {
    return null;
  }
}

async function resolve(url, signal = null) {
  try {
    const currentUA = getSessionUA();
    console.log(`[VidHide] TV-Resolving: ${url}`);
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const response = await fetch(url, {
      signal,
      headers: {
        "User-Agent": currentUA,
        "Referer": `https://${domain}/`
      }
    });
    if (!response.ok)
      return null;
    const html = await response.text();
    let finalUrl = null;
    let quality = "1080p";

    const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
    if (packedMatch) {
      const unpacked = unpackVidHide(packedMatch[0]);
      if (unpacked) {
        const hlsMatch = unpacked.match(/"hls[24]"\s*:\s*"([^"]+)"/);
        if (hlsMatch)
          finalUrl = hlsMatch[1];
        const labelMatch = unpacked.match(/\{label\s*:\s*"([^"]+)"/i) || unpacked.match(/name\s*:\s*"([^"]+)"/i);
        if (labelMatch)
          quality = labelMatch[1].toLowerCase().includes("p") ? labelMatch[1] : labelMatch[1] + "p";
      }
    }
    if (!finalUrl) {
      const rawMatch = html.match(/"hls[24]"\s*:\s*"([^"]+)"/) || html.match(/file\s*:\s*["']([^"']+)["']/i) || html.match(/["'](https?:\/\/[^"']+?\/stream\/[^"']+?\.m3u8[^"']*?)["']/i);
      if (rawMatch)
        finalUrl = rawMatch[1];
    }
    if (!finalUrl)
      return null;
    if (!finalUrl.startsWith("http"))
      finalUrl = new URL(url).origin + finalUrl;
    if (!finalUrl.includes("referer="))
      finalUrl += (finalUrl.includes("?") ? "&" : "?") + "referer=embed69.org";

    const reqHeaders = {
      ...getStealthHeaders(),
      "Referer": url.split("?")[0],
      "Origin": new URL(url).origin,
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": currentUA
    };
    const streamObj = { url: finalUrl, headers: reqHeaders };
    const validation = await validateStream(streamObj, signal);
    const isLive = validation ? validation.verified : true;
    const streamQuality = validation && validation.quality ? validation.quality : quality;
    return {
      url: finalUrl,
      quality: streamQuality,
      verified: isLive,
      isReal: validation ? validation.isReal : false,
      serverName: "VidHide",
      headers: reqHeaders
    };
  } catch (e) {
    console.error(`[VidHide] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };