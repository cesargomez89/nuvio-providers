import { fetchJson, getSessionUA, getStealthHeaders } from '../utils/http.js';
import { validateStream } from '../utils/m3u8.js';
import { finalizeStreams } from '../utils/engine.js';
import { isMirror } from '../utils/mirrors.js';
import { getTmdbInfo, getTmdbAliases } from '../utils/tmdb.js';

const BASE_URL = 'https://hackstore.mx';

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

async function resolveVoe(url, signal = null) {
  try {
    const currentUA = getSessionUA();
    console.log(`[HackStore2-VOE] Resolving: ${url}`);
    const response = await fetch(url, { headers: { 'User-Agent': currentUA }, signal });
    if (!response.ok) return null;
    const html = await response.text();
    if (html.includes('window.location.href') && html.length < 2000) {
      const rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
      if (rm) return resolveVoe(rm[1], signal);
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
          const reqHeaders = { 'User-Agent': currentUA, Referer: url };
          const validation = await validateStream(
            { url: data.source, headers: reqHeaders },
            signal
          );
          return {
            url: data.source,
            quality: validation?.quality || '1080p',
            verified: validation?.verified || true,
            isReal: validation?.isReal || false,
            serverName: 'VOE',
            headers: reqHeaders,
          };
        }
      } catch (ex) {
        console.error(`[HackStore2-VOE] Decryption failed: ${ex.message}`);
      }
    }
    const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
    if (m3u8Match) {
      const reqHeaders = { Referer: url, 'User-Agent': currentUA };
      return { url: m3u8Match[1], quality: '1080p', serverName: 'VOE', headers: reqHeaders };
    }
    return null;
  } catch (error) {
    console.error(`[HackStore2-VOE] Error: ${error.message}`);
    return null;
  }
}

async function resolveStreamWish(url, signal = null) {
  try {
    const UA = getSessionUA();
    const rawId = url
      .split('/')
      .pop()
      .replace(/\.html$/, '');
    const mirrors = [
      `https://hanerix.com/e/${rawId}`,
      `https://embedwish.com/e/${rawId}`,
      `https://hglink.to/e/${rawId}`,
      url,
      `https://streamwish.to/e/${rawId}`,
      `https://awish.pro/e/${rawId}`,
      `https://strwish.com/e/${rawId}`,
    ];
    console.log(`[HackStore2-StreamWish] Race-Resolving: ${rawId}`);
    const validResult = await new Promise((resolveRace) => {
      let resolved = false;
      let pending = mirrors.length;
      mirrors.forEach(async (mirror) => {
        try {
          const mirrorObj = new URL(mirror);
          const mirrorOrigin = mirrorObj.origin;
          const resp = await fetch(mirror, {
            headers: { Referer: mirror, 'User-Agent': UA },
            signal,
          });
          if (!resp.ok) throw new Error();
          const html = await resp.text();
          let m3u8Url = null;
          const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/i);
          if (fileMatch) m3u8Url = fileMatch[1];
          if (m3u8Url && !resolved) {
            resolved = true;
            m3u8Url = m3u8Url.replace(/\\/g, '');
            if (m3u8Url.startsWith('/')) m3u8Url = mirrorOrigin + m3u8Url;
            resolveRace({ url: m3u8Url, mirror });
          }
        } catch {
        } finally {
          pending--;
          if (pending === 0 && !resolved) resolveRace(null);
        }
      });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolveRace(null);
        }
      }, 3500);
    });
    if (!validResult) return null;
    const reqHeaders = {
      Referer: validResult.mirror,
      Origin: new URL(validResult.mirror).origin,
      'User-Agent': UA,
    };
    return { url: validResult.url, quality: 'Auto', serverName: 'StreamWish', headers: reqHeaders };
  } catch {
    return null;
  }
}

function unpackVidHide(script) {
  try {
    const match = script.match(
      /eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
    );
    if (!match) return null;
    let [, p, a, , k] = match;
    a = parseInt(a);
    k = k.split('|');
    const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    const decode = (l, s) => {
      let res = '';
      while (l > 0) {
        res = chars[l % s] + res;
        l = Math.floor(l / s);
      }
      return res || '0';
    };
    return p.replace(/\b\w+\b/g, (l) => {
      const s = parseInt(l, 36);
      return s < k.length && k[s] ? k[s] : decode(s, a);
    });
  } catch {
    return null;
  }
}

async function resolveVidHide(url, signal = null) {
  try {
    const currentUA = getSessionUA();
    console.log(`[HackStore2-VidHide] Resolving: ${url}`);
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const response = await fetch(url, {
      signal,
      headers: { 'User-Agent': currentUA, Referer: `https://${domain}/` },
    });
    if (!response.ok) return null;
    const html = await response.text();
    let finalUrl = null;
    let quality = '1080p';
    const packedMatch = html.match(
      /eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/
    );
    if (packedMatch) {
      const unpacked = unpackVidHide(packedMatch[0]);
      if (unpacked) {
        const hlsMatch = unpacked.match(/"hls[24]"\s*:\s*"([^"]+)"/);
        if (hlsMatch) finalUrl = hlsMatch[1];
        const labelMatch = unpacked.match(/\{label\s*:\s*"([^"]+)"/i);
        if (labelMatch)
          quality = labelMatch[1].toLowerCase().includes('p') ? labelMatch[1] : labelMatch[1] + 'p';
      }
    }
    if (!finalUrl) {
      const rawMatch =
        html.match(/"hls[24]"\s*:\s*"([^"]+)"/) || html.match(/file\s*:\s*["']([^"']+)["']/i);
      if (rawMatch) finalUrl = rawMatch[1];
    }
    if (!finalUrl) return null;
    if (!finalUrl.startsWith('http')) finalUrl = new URL(url).origin + finalUrl;
    const reqHeaders = {
      ...getStealthHeaders(),
      Referer: url.split('?')[0],
      Origin: new URL(url).origin,
      'User-Agent': currentUA,
    };
    return { url: finalUrl, quality, serverName: 'VidHide', headers: reqHeaders };
  } catch {
    return null;
  }
}

async function resolveFilemoon(url, signal = null) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const videoId = urlObj.pathname
      .split('/')
      .filter((p) => !!p)
      .pop();
    if (!videoId) return null;
    const UA_CHROME = getSessionUA();
    console.log(`[HackStore2-Filemoon] Resolving: ${videoId}`);
    try {
      const playbackUrl = `https://${hostname}/api/videos/${videoId}/embed/playback`;
      const response = await fetch(playbackUrl, {
        signal,
        headers: { 'User-Agent': UA_CHROME, Referer: url, Origin: `https://${hostname}` },
      });
      if (response.ok) {
        const playbackData = await response.json();
        if (playbackData && playbackData.playback) {
          const { decryptByse } = await import('../utils/aes_gcm.js');
          const decrypted = decryptByse(playbackData.playback);
          if (decrypted) {
            const data = decrypted.includes('{') ? JSON.parse(decrypted) : null;
            const directUrl = data?.sources?.[0]?.url || data?.url;
            if (directUrl) {
              return {
                url: directUrl,
                quality: data?.sources?.[0]?.label || '1080p',
                verified: true,
                serverName: 'Filemoon',
                headers: {
                  'User-Agent': UA_CHROME,
                  Referer: `https://${hostname}/`,
                  Origin: `https://${hostname}`,
                },
              };
            }
          }
        }
      }
    } catch (err) {
      console.log(`[HackStore2-Filemoon] Shield Fallback: ${err.message}`);
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveEmbed(url, hint = '') {
  const s = url.toLowerCase();
  const serverHint = (hint || '').toLowerCase();
  if (serverHint.includes('voe') || s.includes('voe')) return await resolveVoe(url);
  if (serverHint.includes('wish') || s.includes('streamwish') || s.includes('filelions'))
    return await resolveStreamWish(url);
  if (serverHint.includes('vidhide') || s.includes('vidhide')) return await resolveVidHide(url);
  if (serverHint.includes('filemoon') || s.includes('filemoon')) return await resolveFilemoon(url);
  if (isMirror(s, 'VOE')) return await resolveVoe(url);
  if (isMirror(s, 'STREAMWISH')) return await resolveStreamWish(url);
  if (isMirror(s, 'FILEMOON')) return await resolveFilemoon(url);
  if (isMirror(s, 'VIDHIDE')) return await resolveVidHide(url);
  return { url, quality: 'HD', verified: false };
}

function normalizeSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId) return [];
  console.log(`[HackStore2] API Fast-Track: ${title || tmdbId} (TMDB: ${tmdbId})`);
  try {
    const [info, aliases] = await Promise.all([
      getTmdbInfo(tmdbId, mediaType),
      getTmdbAliases(tmdbId, mediaType),
    ]);
    const year = info?.year || '';
    const baseTitles = new Set();
    if (title) baseTitles.add(title);
    if (info?.title) baseTitles.add(info.title);
    if (aliases) aliases.forEach((a) => baseTitles.add(a));

    const slugsToTry = [];
    for (const t of baseTitles) {
      const sl = normalizeSlug(t);
      if (!sl) continue;
      if (year) slugsToTry.push(`${sl}-${year}`);
      slugsToTry.push(sl);
    }
    const uniqueSlugs = [...new Set(slugsToTry)].slice(0, 6);
    console.log(`[HackStore2] Slug Storm:`, uniqueSlugs);

    let targetId = null;
    const postType = mediaType === 'movie' || mediaType === 'movies' ? 'movies' : 'tvshows';

    const idResults = await Promise.all(
      uniqueSlugs.map(async (slug) => {
        const endpoint = `${BASE_URL}/wp-api/v1/single/${postType}?slug=${slug}&postType=${postType}`;
        try {
          const res = await fetchJson(endpoint);
          if (res && res.data && res.data._id) {
            return { slug, id: res.data._id };
          }
        } catch {}
        return null;
      })
    );

    const match = idResults.find((r) => r !== null);
    if (match) {
      targetId = match.id;
      console.log(`[HackStore2] Match! Slug: ${match.slug} -> ID: ${targetId}`);
    }

    if (!targetId) {
      console.log('[HackStore2] ID not found.');
      return [];
    }

    if (postType === 'tvshows') {
      console.log(`[HackStore2] Episode S${season}E${episode}...`);
      const epListUrl = `${BASE_URL}/wp-api/v1/single/episodes/list?_id=${targetId}&season=${season}&page=1&postsPerPage=200`;
      const epRes = await fetchJson(epListUrl);
      if (epRes && epRes.data && epRes.data.posts) {
        const epObj = epRes.data.posts.find(
          (p) => p.season_number == season && p.episode_number == episode
        );
        if (epObj && epObj._id) {
          targetId = epObj._id;
        } else {
          return [];
        }
      } else {
        return [];
      }
    }

    const playerResponse = await fetchJson(`${BASE_URL}/wp-api/v1/player?postId=${targetId}`);
    if (!playerResponse || !playerResponse.data || !playerResponse.data.embeds) return [];

    const playerData = playerResponse.data.embeds.slice(0, 15);
    const streamPromises = playerData.map(async (p) => {
      const lang = (p.lang || 'Latino').toLowerCase();
      if (
        lang.includes('sub') ||
        lang.includes('vose') ||
        lang.includes('eng') ||
        lang.includes('espana')
      )
        return null;
      const rawUrl = p.url;
      if (!rawUrl || rawUrl.includes('la.movie')) return null;
      try {
        const resolved = await resolveEmbed(rawUrl);
        if (!resolved || !resolved.url) return null;
        return {
          url: resolved.url,
          quality: resolved.quality || 'HD',
          verified: resolved.verified || false,
          langLabel: 'Latino',
          serverName: resolved.serverName || p.server || 'Online',
          headers: resolved.headers || {},
        };
      } catch {
        return null;
      }
    });

    const candidates = (await Promise.all(streamPromises)).filter(Boolean);
    return await finalizeStreams(candidates, 'HackStore2', title || '');
  } catch (error) {
    console.error(`[HackStore2] Fatal Error:`, error.message);
    return [];
  }
}
