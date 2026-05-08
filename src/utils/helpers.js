function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function padEpisode(episode) {
  return String(episode).padStart(2, '0');
}

function isMovie(mediaType) {
  return mediaType === 'movie' || mediaType === 'movies';
}

function cleanTmdbId(tmdbId) {
  return tmdbId ? tmdbId.toString().split(':')[0] : tmdbId;
}

function toDoubleBase64(str) {
  try {
    if (typeof btoa !== 'undefined') return btoa(str);
  } catch {}
  try {
    if (typeof Buffer !== 'undefined') return Buffer.from(str, 'utf-8').toString('base64');
  } catch {}
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c < 0xd800 || c >= 0xe000)
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    else {
      i++;
      const cp = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    }
  }
  const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let r = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i],
      b1 = bytes[i + 1],
      b2 = bytes[i + 2];
    if (b1 === undefined) r += b64[b0 >> 2] + b64[(b0 & 3) << 4] + '==';
    else if (b2 === undefined)
      r += b64[b0 >> 2] + b64[((b0 & 3) << 4) | (b1 >> 4)] + b64[(b1 & 15) << 2] + '=';
    else
      r +=
        b64[b0 >> 2] +
        b64[((b0 & 3) << 4) | (b1 >> 4)] +
        b64[((b1 & 15) << 2) | (b2 >> 6)] +
        b64[b2 & 63];
  }
  return r;
}

function b64decode(str) {
  try {
    if (typeof atob !== 'undefined') return atob(str);
  } catch {}
  try {
    if (typeof Buffer !== 'undefined') return Buffer.from(str, 'base64').toString('utf8');
  } catch {}
  try {
    const s = str.replace(/[\s]/g, '');
    if (s.length % 4 !== 0) return null;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const lookup = {};
    for (let i = 0; i < chars.length; i++) lookup[chars[i]] = i;
    let r = '';
    for (let i = 0; i < s.length; i += 4) {
      const c0 = lookup[s[i]],
        c1 = lookup[s[i + 1]],
        c2 = lookup[s[i + 2]],
        c3 = lookup[s[i + 3]];
      if (c0 === undefined || c1 === undefined || c2 === undefined || c3 === undefined) return null;
      r += String.fromCharCode((c0 << 2) | (c1 >> 4));
      if (c2 !== 64) {
        r += String.fromCharCode(((c1 & 15) << 4) | (c2 >> 2));
        if (c3 !== 64) r += String.fromCharCode(((c2 & 3) << 6) | c3);
      }
    }
    return r;
  } catch {
    return null;
  }
}

module.exports = { sleep, padEpisode, isMovie, cleanTmdbId, toDoubleBase64, b64decode };
