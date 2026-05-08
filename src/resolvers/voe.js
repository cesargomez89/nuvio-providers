const { getSessionUA } = require('../utils/http.js');
const { validateStream } = require('../utils/m3u8.js');

const VOE_MIRRORS = ['voe.sx', 'voe-sx', 'voex.sx'];

function localAtob(input) {
  if (!input) return '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = String(input)
    .replace(/=+$/, '')
    .replace(/[\s\n\r\t]/g, '');
  let output = '';
  if (str.length % 4 === 1) return '';
  for (
    let bc = 0, bs, buffer, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

async function tryResolve(url, signal) {
  const currentUA = getSessionUA();
  console.log(`[VOE] TV-Resolving: ${url}`);
  const response = await fetch(url, {
    headers: { 'User-Agent': currentUA },
    signal,
  });
  if (!response.ok) return null;
  const html = await response.text();
  if (html.includes('window.location.href') && html.length < 2000) {
    const rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
    if (rm) return tryResolve(rm[1], signal);
  }
  const jsonMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      let encText = Array.isArray(parsed) ? parsed[0] : parsed;
      if (typeof encText !== 'string') return null;
      let decoded = encText.replace(/[a-zA-Z]/g, (c) => {
        const code = c.charCodeAt(0);
        const limit = c <= 'Z' ? 90 : 122;
        const shifted = code + 13;
        return String.fromCharCode(limit >= shifted ? shifted : shifted - 26);
      });
      const noise = ['@$', '^^', '~@', '%?', '*~', '!!', '#&'];
      for (const n of noise) decoded = decoded.split(n).join('');
      const b64_1 = localAtob(decoded);
      if (!b64_1) throw new Error('LocalAtob failed stage 1');
      let shiftedStr = '';
      for (let j = 0; j < b64_1.length; j++) {
        shiftedStr += String.fromCharCode(b64_1.charCodeAt(j) - 3);
      }
      const reversed = shiftedStr.split('').reverse().join('');
      const decrypted = localAtob(reversed);
      if (!decrypted) throw new Error('LocalAtob failed stage 2');
      const data = JSON.parse(decrypted);
      if (data && data.source) {
        console.log(`[VOE] Success: ${data.source.substring(0, 50)}...`);
        const reqHeaders = { 'User-Agent': currentUA, Referer: url };
        const streamObj = { url: data.source, headers: reqHeaders };
        const validation = await validateStream(streamObj, signal);
        const isLive = validation ? validation.verified : true;
        const streamQuality = validation && validation.quality ? validation.quality : '1080p';
        return {
          url: data.source,
          quality: streamQuality,
          verified: isLive,
          isReal: validation ? validation.isReal : false,
          serverName: 'VOE',
          headers: reqHeaders,
        };
      }
    } catch (ex) {
      console.error(`[VOE] Decryption failed: ${ex.message}`);
    }
  }
  const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
  if (m3u8Match) {
    const fallbackUrl = m3u8Match[1];
    const reqHeaders = { Referer: url, 'User-Agent': currentUA };
    const streamObj = { url: fallbackUrl, headers: reqHeaders };
    const validation = await validateStream(streamObj, signal);
    return {
      url: fallbackUrl,
      quality: validation?.quality || '1080p',
      verified: validation ? validation.verified : true,
      isReal: validation ? validation.isReal : false,
      serverName: 'VOE',
      headers: reqHeaders,
    };
  }
  return null;
}

async function resolve(url, signal = null) {
  // Try the original URL first
  let result = await tryResolve(url, signal);
  if (result) return result;

  // Try mirror domains
  for (const mirror of VOE_MIRRORS) {
    if (url.includes(mirror)) continue;
    const mirrorUrl = url.replace(/voe\.sx|voe-sx|voex\.sx/, mirror);
    result = await tryResolve(mirrorUrl, signal);
    if (result) return result;
  }

  return null;
}

module.exports = { resolve };
