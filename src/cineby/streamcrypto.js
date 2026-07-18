const _MASK = 0xffffffff;
const _GOLDEN = 2654435769;
const _MAGIC = [109, 118, 109, 49]; // "mvm1"

function _imul(a, b) {
  return Math.imul(a, b) >>> 0;
}

function _f(e) {
  e = e >>> 0;
  e ^= e >>> 16;
  e = _imul(e, 2246822507);
  e ^= e >>> 13;
  e = _imul(e, 3266489909);
  e ^= e >>> 16;
  return e >>> 0;
}

function _rotl(e, t) {
  e = e >>> 0;
  t = t & 31;
  if (t === 0) return e;
  return ((e << t) | (e >>> (32 - t))) >>> 0;
}

function _fnv_f(text) {
  let t = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    t = _imul(t ^ text.charCodeAt(i), 16777619);
  }
  return _f(t);
}

function _key_schedule(seed, media_id) {
  const n = _f(_fnv_f(seed) ^ _f((media_id & _MASK) ^ _GOLDEN)) >>> 0;
  const state = {};
  let currentN = n;
  for (let e = 0; e < 8; e++) {
    const idx = currentN % 61;
    currentN = _rotl((currentN + _GOLDEN) >>> 0, 7 + (e & 7));
    state[idx] = (currentN ^ _f(currentN)) >>> 0;
    currentN = _f((currentN + idx) >>> 0);
  }
  const acc = _f((2779096485 ^ currentN) >>> 0);
  return { state, acc };
}

function _keystream(seed, media_id, length) {
  const { state, acc: initialAcc } = _key_schedule(seed, media_id);
  const stateCopy = {};
  for (const k in state) stateCopy[k] = state[k];
  let acc = initialAcc;
  const out = [];
  let pos = 0;
  let counter = 0;
  while (pos < length) {
    const a = acc >>> 0;
    const i = a % 61;
    const mask = stateCopy.hasOwnProperty(i) ? _MASK : 0;
    const low = (stateCopy[i] || 0) >>> 0;
    const n = (low ^ _imul(_GOLDEN, counter + 1)) >>> 0;
    let c = ((a ^ n) | (a & n & mask)) >>> 0;
    c = (_rotl((c + a) >>> 0, i & 31) ^ _rotl(a, _imul(i, 7) & 31)) >>> 0;
    acc = _f((c + _GOLDEN) >>> 0);
    stateCopy[i] = acc >>> 0;
    counter++;
    const val = acc >>> 0;
    out[pos] = val & 255;
    pos++;
    if (pos < length) {
      out[pos] = (val >> 8) & 255;
      pos++;
    }
    if (pos < length) {
      out[pos] = (val >> 16) & 255;
      pos++;
    }
    if (pos < length) {
      out[pos] = (val >> 24) & 255;
      pos++;
    }
  }
  return out;
}

function _b64_decode(text) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const map = {};
  for (let i = 0; i < 64; i++) map[chars[i]] = i;
  const out = [];
  for (let i = 0; i < text.length; i += 4) {
    const c1 = map[text[i]];
    const c2 = map[text[i + 1]];
    const c3 = map[text[i + 2]];
    const c4 = map[text[i + 3]];
    if (c1 === undefined || c2 === undefined) break;
    out.push((c1 << 2) | (c2 >> 4));
    if (c3 !== undefined) {
      out.push(((c2 & 15) << 4) | (c3 >> 2));
      if (c4 !== undefined) out.push(((c3 & 3) << 6) | c4);
    }
  }
  return out;
}

function _b64url_decode(text) {
  text = text.trim().replace(/-/g, '+').replace(/_/g, '/');
  while (text.length % 4 !== 0) text += '=';
  return _b64_decode(text);
}

function _utf8_decode(bytes) {
  let str = '';
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    if (b < 128) {
      str += String.fromCharCode(b);
      i++;
    } else if (b < 224) {
      const b2 = bytes[i + 1];
      str += String.fromCharCode(((b & 31) << 6) | (b2 & 63));
      i += 2;
    } else if (b < 240) {
      const b2 = bytes[i + 1];
      const b3 = bytes[i + 2];
      str += String.fromCharCode(((b & 15) << 12) | ((b2 & 63) << 6) | (b3 & 63));
      i += 3;
    } else {
      const b2 = bytes[i + 1];
      const b3 = bytes[i + 2];
      const b4 = bytes[i + 3];
      const cp = ((b & 7) << 18) | ((b2 & 63) << 12) | ((b3 & 63) << 6) | (b4 & 63);
      str += String.fromCharCode((cp >> 10) + 0xd800, (cp & 0x3ff) + 0xdc00);
      i += 4;
    }
  }
  return str;
}

export function decryptSources(encrypted, seed, mediaId) {
  const data = _b64url_decode(encrypted);
  const ks = _keystream(seed, parseInt(mediaId), data.length);
  for (let i = 0; i < data.length; i++) {
    data[i] ^= ks[i];
  }
  for (let i = 0; i < 4; i++) {
    if (data[i] !== _MAGIC[i]) {
      throw new Error('STREAMCRYPTO: bad seed or tampered payload');
    }
  }
  return JSON.parse(_utf8_decode(data.slice(4)));
}
