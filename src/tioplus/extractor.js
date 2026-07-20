import { fetchHtml, getSessionUA } from '../utils/http.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbInfo } from '../utils/tmdb.js';
import { allSettled } from '../utils/parallel.js';
import { isMovie, toDoubleBase64 } from '../utils/helpers.js';

const BASE_URL = 'https://tioplus.app';
const UA = getSessionUA();

async function getRedirectUrl(serverEncoded, referer) {
  try {
    const doubleB64 = toDoubleBase64(serverEncoded);
    const playerUrl = `${BASE_URL}/player/${doubleB64}`;
    const html = await fetchHtml(playerUrl, {
      headers: { 'User-Agent': UA, Referer: referer },
    });
    if (!html || html.length < 50) return null;
    const match = html.match(/(?:window\.)?location\.href\s*=\s*['"]([^'"]+)['"]/i);
    let finalUrl = match ? match[1] : null;
    if (finalUrl && finalUrl.includes('up.asdasd')) {
      const netuIdMatch = finalUrl.match(/\.site(.*?)$/);
      if (netuIdMatch) finalUrl = 'https://netu.to' + netuIdMatch[1];
    }
    return finalUrl;
  } catch {
    return null;
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId || !mediaType) return [];
  console.log(`[TioPlus] Looking for content: ${tmdbId} (${mediaType})`);

  try {
    const tmdbInfo = await getTmdbInfo(tmdbId, mediaType, 'es-ES');
    const mediaTitle = tmdbInfo?.title || title;
    const releaseYear = tmdbInfo?.year || '';
    if (!mediaTitle) return [];
    console.log(`[TioPlus] Searching: ${mediaTitle} (${releaseYear})`);
    const searchQuery = mediaTitle
      .split(/[:(]/)[0]
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const candidates = [];

    const typePrefix = isMovie(mediaType) ? 'pelicula' : 'serie';
    const directUrl = `${BASE_URL}/${typePrefix}/${searchQuery}`;
    const directHtml = await fetchHtml(directUrl, {
      headers: { 'User-Agent': UA },
    });
    if (
      directHtml &&
      !directHtml.includes('404') &&
      !directHtml.includes('Not Found') &&
      directHtml.length > 1000
    ) {
      candidates.push({ url: directUrl, title: mediaTitle });
    }

    if (candidates.length === 0) {
      const searchUrl = `${BASE_URL}/api/search/${encodeURIComponent(searchQuery)}`;
      const html = await fetchHtml(searchUrl, {
        headers: { 'User-Agent': UA },
      });
      if (html) {
        const itemRegex =
          /<article[^>]*class=['"]item[^>]*>[\s\S]*?<a[^>]*href=['"]([^'"]+)['"][\s\S]*?<h2>([\s\S]*?)<\/h2>/gi;
        let match;
        while ((match = itemRegex.exec(html)) !== null) {
          candidates.push({ url: match[1], title: match[2].trim() });
        }
      }
    }
    if (candidates.length === 0) return [];
    let targetUrl = null;
    let bestScore = -1;
    const keywords = mediaTitle
      .toLowerCase()
      .split(/[: ]/)
      .filter((w) => w.length > 2);
    for (const cand of candidates) {
      const candTitle = cand.title.toLowerCase();
      let score = 0;
      if (keywords.length > 0 && candTitle.startsWith(keywords[0])) score += 10;
      keywords.forEach((word) => {
        if (candTitle.includes(word)) score += 5;
      });
      if (releaseYear && cand.title.includes(`(${releaseYear})`)) score += 50;
      if (candTitle.includes(mediaTitle.toLowerCase())) score += 10;
      const isCorrectType =
        (isMovie(mediaType) && cand.url.includes('/pelicula/')) ||
        (!isMovie(mediaType) && cand.url.includes('/serie/'));
      if (isCorrectType && score > bestScore) {
        bestScore = score;
        targetUrl = cand.url;
      }
    }
    if (bestScore < 5) return [];
    let finalMediaUrl = targetUrl;
    if (!isMovie(mediaType)) {
      const s = parseInt(season) || 1;
      const e = parseInt(episode) || 1;
      finalMediaUrl = `${targetUrl}/season/${s}/episode/${e}`;
    }
    const mediaHtml = await fetchHtml(finalMediaUrl, {
      headers: { 'User-Agent': UA, Referer: BASE_URL },
    });
    if (!mediaHtml) return [];
    const serverRegex = /data-server=['"]([^'"]+)['"][^>]*>[\s\S]*?<span>([^<]+)<\/span>/gi;
    let sMatch;
    const encodes = [];
    while ((sMatch = serverRegex.exec(mediaHtml)) !== null) {
      const enc = sMatch[1];
      const rawServerName = sMatch[2].trim();
      const parts = rawServerName.split('-').map((s) => s.trim());
      const serverName = parts[0];
      let lang = 'LAT';
      if (parts.length > 1) {
        const langPart = parts[1].toUpperCase();
        if (/LAT|LATINO/.test(langPart)) lang = 'LAT';
        else if (/ESP|CAST|ESPAÑA|ESPAÑOL/.test(langPart)) lang = 'ESP';
        else if (/SUB|SUBT/.test(langPart)) lang = 'SUB';
      }
      encodes.push({ enc, serverName, lang });
    }
    if (encodes.length === 0) return [];

    const resolutionPromises = encodes.map(async (item) => {
      try {
        const realEmbedUrl = await getRedirectUrl(item.enc, finalMediaUrl);
        if (!realEmbedUrl || !realEmbedUrl.startsWith('http')) return [];
        const resolved = await resolveEmbed(realEmbedUrl);
        if (resolved && (resolved.url || (Array.isArray(resolved) && resolved.length > 0))) {
          const streamsArray = Array.isArray(resolved) ? resolved : [resolved];
          return streamsArray.map((s) => ({
            ...s,
            serverLabel: item.serverName,
            langLabel:
              item.lang === 'LAT' ? 'Latino' : item.lang === 'ESP' ? 'Español' : 'Subtitulado',
          }));
        }
      } catch {
        return [];
      }
    });

    const allResolved = await allSettled(resolutionPromises);
    const resolvedStreams = [];
    allResolved.forEach((r) => {
      if (r.status === 'fulfilled' && r.value) {
        resolvedStreams.push(...r.value);
      }
    });

    const qualityScore = { '4K': 5, '2160p': 5, '1080p': 4, '720p': 3, '480p': 2, '360p': 1, SD: 0 };
    const seen = new Set();
    return resolvedStreams
      .sort((a, b) => (qualityScore[b.quality] || 0) - (qualityScore[a.quality] || 0))
      .filter((s) => {
        const key = s.url;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((s) => ({
        name: 'TioPlus',
        title: `${s.langLabel || 'Latino'} - ${s.serverLabel || 'Servidor'}`,
        url: s.url,
        quality: s.quality || 'HD',
        headers: s.headers || {},
      }));
  } catch (error) {
    console.error(`[TioPlus] Error: ${error.message}`);
    return [];
  }
}
