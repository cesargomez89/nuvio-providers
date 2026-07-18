import { fetchHtml, getSessionUA } from '../utils/http.js';
import { resolveEmbed, getDirectCdnHeaders } from '../utils/resolvers.js';
import { getTmdbTitle, getTmdbInfo } from '../utils/tmdb.js';
import { isMovie } from '../utils/helpers.js';

const BASE = 'https://pelispedia.mov';
const UA = getSessionUA();

function normalizeTitle(t) {
  if (!t) return '';
  return t
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractPlayerEmbeds(url, signal) {
  try {
    const html = await fetchHtml(url, { headers: { Referer: BASE + '/' }, signal });
    if (!html) return [];

    const $ = require('cheerio-without-node-native').load(html);
    const streams = [];
    const seenUrls = new Set();

    $('.player-content iframe').each((i, el) => {
      let iframeUrl = $(el).attr('src');
      if (iframeUrl) {
        if (iframeUrl.startsWith('/')) iframeUrl = BASE + iframeUrl;
        if (!seenUrls.has(iframeUrl)) {
          seenUrls.add(iframeUrl);
          const serverName = $(`#server-option-${i} .title`).text().trim() || 'Servidor';
          streams.push({
            servername: serverName,
            url: iframeUrl,
            language: 'Latino',
            quality: '1080p',
            headers: { 'User-Agent': UA, Referer: url },
          });
        }
      }
    });

    if (streams.length === 0) {
      const re = /<iframe[^>]+src="([^"]+)"/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        let iframeUrl = m[1];
        if (iframeUrl.startsWith('/')) iframeUrl = BASE + iframeUrl;
        if (iframeUrl.includes('embed69') || iframeUrl.includes('xupalace')) {
          if (!seenUrls.has(iframeUrl)) {
            seenUrls.add(iframeUrl);
            streams.push({
              servername: iframeUrl.includes('embed69') ? 'Embed69' : 'Servidor',
              url: iframeUrl,
              language: 'Latino',
              quality: '1080p',
            });
          }
        }
      }
    }

    console.log(`[PelisPedia Extractor] Found ${streams.length} potential streams.`);
    return streams;
  } catch (e) {
    console.error('[PelisPedia Extractor] Error:', e.message);
    return [];
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId && !title) return [];

  const OVERALL_TIMEOUT = 30000;
  const hasAbort = typeof AbortController !== 'undefined';
  const mainController = hasAbort ? new AbortController() : null;
  const mainTimer = mainController ? setTimeout(() => mainController.abort(), OVERALL_TIMEOUT) : null;

  let searchTitle = title;
  if (!searchTitle) {
    console.log(`[PelisPedia] Resolving title for ${tmdbId}...`);
    const info = await getTmdbInfo(tmdbId, mediaType, 'es-MX');
    if (info) {
      searchTitle = info.title;
    }
    if (!searchTitle) {
      searchTitle = await getTmdbTitle(tmdbId, mediaType, 'en-US');
    }
  }

  if (!searchTitle) {
    console.log('[PelisPedia] Could not resolve title');
    return [];
  }

  const isMovieType = isMovie(mediaType);
  const targetType = isMovieType ? 'pelicula' : 'serie';
  console.log(`[PelisPedia] Looking for: ${searchTitle}`);

  try {
    const searchUrl = `${BASE}/search?s=${normalizeTitle(searchTitle).replace(/\s+/g, '+')}`;
    const html = await fetchHtml(searchUrl, {
      headers: { Referer: BASE + '/' },
      signal: mainController ? mainController.signal : undefined,
    });

    const re = /href="(https:\/\/pelispedia\.mov\/(pelicula|serie)\/([^"]+))"/gi;
    let best = null;
    let m;
    while ((m = re.exec(html)) !== null) {
      if (m[2] !== targetType) continue;
      if (!best) {
        best = { url: m[1], type: m[2], slug: m[3] };
      }
    }

    if (!best) {
      console.log('[PelisPedia] No results found');
      return [];
    }

    let targetUrl = best.url;

    if (!isMovieType) {
      targetUrl = `${BASE}/serie/${best.slug}/temporada/${season || 1}/capitulo/${episode || 1}`;
    }

    console.log(`[PelisPedia] Found: ${targetUrl}`);

    const rawEmbeds = await extractPlayerEmbeds(targetUrl, mainController ? mainController.signal : undefined);
    const streams = [];
    const EMBED_LIMIT = 3;

    for (let i = 0; i < rawEmbeds.length; i += EMBED_LIMIT) {
      const batch = rawEmbeds.slice(i, i + EMBED_LIMIT);
      const batchResults = await Promise.allSettled(
        batch.map(async (embed) => {
          let currentUrl = embed.url;
          let resolved = null;

          resolved = await resolveEmbed(currentUrl, mainController ? mainController.signal : undefined);

          if (resolved) {
            const results = Array.isArray(resolved) ? resolved : [resolved];
            for (const r of results) {
              if (r.url) {
                return {
                  name: 'PelisPedia',
                  title: `${r.quality || '1080p'} · Latino · ${r.servername || embed.servername || 'Server'}`,
                  url: r.url,
                  headers: r.headers ||
                    getDirectCdnHeaders(r.url) || { 'User-Agent': UA, Referer: currentUrl },
                };
              }
            }
          }
          return null;
        })
      );
      for (const r of batchResults) {
        if (r.status === 'fulfilled' && r.value) streams.push(r.value);
      }
    }

    return streams;
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log(`[PelisPedia] Timeout tras ${OVERALL_TIMEOUT}ms`);
    } else {
      console.error('[PelisPedia] Error:', e.message);
    }
    return [];
  } finally {
    clearTimeout(mainTimer);
  }
}
