import { fetchHtml, getStealthHeaders } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle, getTmdbAliases } from '../utils/tmdb.js';
import { isMovie, cleanTmdbId, sleep } from '../utils/helpers.js';
import { titleMatch, normalizeTitle } from '../utils/title.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE = 'https://sololatino.net';
const HEADERS = { ...getStealthHeaders(), 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' };

let xsrfToken = null;
let cookieJar = '';

async function ensureXsrfToken() {
  if (xsrfToken) return;
  const res = await fetch(BASE + '/sanctum/csrf-cookie', {
    method: 'GET',
    headers: { 'User-Agent': HEADERS['User-Agent'] },
  });
  const cookieParts = [];
  for (const c of res.headers.getSetCookie()) {
    cookieParts.push(c.split(';')[0]);
    const match = c.match(/XSRF-TOKEN=([^;]+)/);
    if (match) xsrfToken = decodeURIComponent(match[1]);
  }
  cookieJar = cookieParts.join('; ');
}

function isLatinAlias(title) {
  const stripped = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const latinChars = stripped.replace(/[^a-zA-Z0-9\s\-\.\,\!\?\'\"\:\;]/g, '');
  return latinChars.length / Math.max(stripped.length, 1) > 0.7;
}

function findSlugByTitle(html, searchTitle) {
  const linkRegex =
    /<a\s+href="(https?:\/\/sololatino\.net\/(?:serie|pelicula)\/[^"]+)"[^>]*>[\s\S]*?alt="([^"]+)"/gi;
  const normalizedSearch = normalizeTitle(searchTitle);
  let candidates = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const resultTitle = match[2].trim();
    if (titleMatch(searchTitle, resultTitle)) {
      candidates.push({ url: match[1], title: resultTitle });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const aNorm = normalizeTitle(a.title);
    const bNorm = normalizeTitle(b.title);
    const aExact = aNorm === normalizedSearch ? 1 : 0;
    const bExact = bNorm === normalizedSearch ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    return (
      Math.abs(a.title.length - searchTitle.length) - Math.abs(b.title.length - searchTitle.length)
    );
  });
  return candidates[0].url;
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId) return [];
  console.log(`[SoloLatino] Looking for content: ${tmdbId} (${mediaType})`);
  try {
    const realId = cleanTmdbId(tmdbId);

    let searchTitle = title;
    if (!searchTitle) {
      searchTitle = await getTmdbTitle(realId, mediaType);
    }
    if (!searchTitle) {
      console.log(`[SoloLatino] No title found for ${realId}`);
      return [];
    }

    const searchUrl = `${BASE}/buscar?q=${encodeURIComponent(searchTitle)}`;
    console.log(`[SoloLatino] Searching: ${searchUrl}`);
    const searchHtml = await fetchHtml(searchUrl, { headers: HEADERS });

    let slugUrl = findSlugByTitle(searchHtml, searchTitle);

    if (!slugUrl) {
      console.log(`[SoloLatino] No title match for "${searchTitle}", trying aliases...`);
      const aliases = await getTmdbAliases(realId, mediaType);
      const latinAliases = aliases.filter((a) => a !== searchTitle && isLatinAlias(a));

      for (const alias of latinAliases) {
        try {
          await sleep(500);
          console.log(`[SoloLatino] Trying alias: "${alias}"`);
          const aliasSearchUrl = `${BASE}/buscar?q=${encodeURIComponent(alias)}`;
          const aliasHtml = await fetchHtml(aliasSearchUrl, { headers: HEADERS });

          slugUrl = findSlugByTitle(aliasHtml, alias);
          if (slugUrl) {
            searchTitle = alias;
            break;
          }
        } catch (e) {
          console.warn(`[SoloLatino] Alias "${alias}" failed: ${e.message}`);
        }
      }
    }

    if (!slugUrl) {
      const fallbackMatch = searchHtml.match(
        /<a\s+href="(https?:\/\/sololatino\.net\/(?:serie|pelicula)\/[^"]+)"[^>]*>[\s\S]*?alt="([^"]+)"/i
      );
      if (fallbackMatch) {
        console.log(
          `[SoloLatino] Using first search result as fallback: ${fallbackMatch[2]} -> ${fallbackMatch[1]}`
        );
        slugUrl = fallbackMatch[1];
      }
    }

    if (!slugUrl) {
      console.log(`[SoloLatino] No match found for TMDB: ${realId}`);
      return [];
    }

    let finalUrl = slugUrl;
    if (!isMovie(mediaType)) {
      const s = parseInt(season || 1);
      const e = parseInt(episode || 1);
      finalUrl = finalUrl.replace(/\/$/, '') + `/temporada-${s}/episodio-${e}`;
    }

    console.log(`[SoloLatino] Fetching: ${finalUrl}`);
    const pageHtml = await fetchHtml(finalUrl, { headers: { ...HEADERS, Referer: BASE } });

    const tokens = [];
    const tokenRegex = /data-player-token="([^"]+)"/g;
    let tMatch;
    while ((tMatch = tokenRegex.exec(pageHtml)) !== null) {
      tokens.push(tMatch[1]);
    }

    if (tokens.length === 0) {
      console.log(`[SoloLatino] No player tokens found`);
      return [];
    }

    await ensureXsrfToken();
    if (!xsrfToken) {
      console.log(`[SoloLatino] Failed to get CSRF token`);
      return [];
    }

    const embedUrls = [];
    for (const token of tokens) {
      try {
        const res = await fetch(BASE + '/api/player-url', {
          method: 'POST',
          headers: {
            'User-Agent': HEADERS['User-Agent'],
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
            Cookie: cookieJar,
            Referer: finalUrl,
          },
          body: JSON.stringify({ t: token }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) embedUrls.push(data.url);
        }
      } catch (e) {
        console.log(`[SoloLatino] Error resolving player token: ${e.message}`);
      }
    }

    if (embedUrls.length === 0) {
      console.log(`[SoloLatino] No embed URLs could be resolved`);
      return [];
    }

    console.log(`[SoloLatino] Found ${embedUrls.length} embeds, resolving...`);

    const resolvedEmbeds = await parallelWithLimit(
      embedUrls,
      async (url) => {
        try {
          const resolved = await resolveEmbed(url);
          if (resolved && resolved.url) {
            return {
              url: resolved.url,
              language: 'Latino',
              serverLabel: resolved.serverName || 'Servidor',
              quality: resolved.quality || '1080p',
              headers: resolved.headers || {},
            };
          }
        } catch (e) {
          console.log(`[SoloLatino] Error resolving ${url}: ${e.message}`);
        }
        return null;
      },
      5
    );

    const streams = resolvedEmbeds.filter(Boolean);

    if (streams.length === 0) {
      console.log(`[SoloLatino] No streams could be resolved`);
      return [];
    }

    return await finalizeStreams(streams, 'SoloLatino', searchTitle);
  } catch (error) {
    console.error(`[SoloLatino] Error: ${error.message}`);
    return [];
  }
}
