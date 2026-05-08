import { fetchHtml, getStealthHeaders } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle, getTmdbAliases } from '../utils/tmdb.js';
import { isMovie, cleanTmdbId, sleep } from '../utils/helpers.js';
import { titleMatch } from '../utils/title.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE = 'https://sololatino.net';
const HEADERS = { ...getStealthHeaders(), 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' };

function findSlugForId(html, targetId) {
  const idIndex = html.indexOf(`data-movie-id="${targetId}"`);
  if (idIndex === -1) return null;
  const beforeSection = html.substring(0, idIndex);
  const hrefRegex = /<a\s+href="(https?:\/\/sololatino\.net\/(?:serie|pelicula)\/[^"]+)"/gi;
  let match;
  let slugUrl = null;
  while ((match = hrefRegex.exec(beforeSection)) !== null) {
    slugUrl = match[1];
  }
  return slugUrl;
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

    const targetId = realId.toString();

    let slugUrl = findSlugForId(searchHtml, targetId);

    if (!slugUrl) {
      console.log(`[SoloLatino] No direct TMDB match for ${targetId}, trying aliases...`);
      const aliases = await getTmdbAliases(realId, mediaType);
      const allTitles = aliases.filter((a) => a !== searchTitle);

      for (const alias of allTitles) {
        try {
          await sleep(500);
          console.log(`[SoloLatino] Trying alias: "${alias}"`);
          const aliasSearchUrl = `${BASE}/buscar?q=${encodeURIComponent(alias)}`;
          const aliasHtml = await fetchHtml(aliasSearchUrl, { headers: HEADERS });

          slugUrl = findSlugForId(aliasHtml, targetId);
          if (slugUrl) {
            searchTitle = alias;
            break;
          }

          const linkRegex =
            /<a\s+href="(https?:\/\/sololatino\.net\/(?:serie|pelicula)\/[^"]+)"[^>]*>\s*([^<]+)\s*<\/a>/gi;
          let linkMatch;
          while ((linkMatch = linkRegex.exec(aliasHtml)) !== null) {
            const resultTitle = linkMatch[2].trim();
            if (titleMatch(alias, resultTitle)) {
              slugUrl = linkMatch[1];
              searchTitle = alias;
              break;
            }
          }
          if (slugUrl) break;
        } catch (e) {
          console.warn(`[SoloLatino] Alias "${alias}" failed: ${e.message}`);
        }
      }
    }

    if (!slugUrl) {
      console.log(`[SoloLatino] No match found for TMDB: ${targetId}`);
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

    const serverUrls = [];
    const serverRegex = /data-server-url="([^"]+)"/g;
    let sMatch;
    while ((sMatch = serverRegex.exec(pageHtml)) !== null) {
      serverUrls.push(sMatch[1]);
    }

    if (serverUrls.length === 0) {
      console.log(`[SoloLatino] No server URLs found`);
      return [];
    }

    console.log(`[SoloLatino] Found ${serverUrls.length} embeds, resolving...`);

    const resolvedEmbeds = await parallelWithLimit(
      serverUrls,
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
