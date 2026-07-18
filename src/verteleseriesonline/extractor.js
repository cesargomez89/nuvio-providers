import { fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle } from '../utils/tmdb.js';
import { cleanTmdbId } from '../utils/helpers.js';
import { buildSlug } from '../utils/title.js';
import { b64decode } from '../utils/helpers.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE_URL = 'https://vip.verteleseriesonline.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'es-MX,es;q=0.9',
  Referer: `${BASE_URL}/`,
};

const FETCH_TIMEOUT = 10000;

function fetchWithTimeout(url, options = {}) {
  const hasAbort = typeof AbortController !== 'undefined';
  const controller = hasAbort ? new AbortController() : null;
  const timeoutId = setTimeout(() => {
    if (controller) controller.abort();
  }, FETCH_TIMEOUT);
  return fetchHtml(url, hasAbort ? { ...options, signal: controller.signal } : options).finally(
    () => clearTimeout(timeoutId)
  );
}

function extractEpisodeLinks(html) {
  const links = [];
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    const seMatch = href.match(/(\d+)x(\d+)/i) || text.match(/(\d+)\s*[x×]\s*(\d+)/);
    if (seMatch) {
      const season = parseInt(seMatch[1], 10);
      const episode = parseInt(seMatch[2], 10);
      const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
      links.push({ season, episode, url: fullUrl, text });
    }
  }
  return links;
}

function extractIframeFromMirrors(html) {
  const mirrors = [];
  const btnRegex = /<button[^>]*\bdata-iframe="([^"]+)"[^>]*>[\s\S]*?<\/button>/gi;
  let match;
  while ((match = btnRegex.exec(html)) !== null) {
    const encoded = match[1];
    const btnFull = match[0];
    const btnText = btnFull.replace(/<[^>]+>/g, '').trim();
    let language = 'Latino';
    if (/castellano/i.test(btnText) || /cast/i.test(btnText)) language = 'Castellano';
    else if (/sub\s*español/i.test(btnText) || /sub/i.test(btnText)) language = 'Sub Español';
    else if (/latino/i.test(btnText)) language = 'Latino';
    const decodedHtml = b64decode(encoded);
    if (decodedHtml) {
      const srcMatch = decodedHtml.match(/src="([^"]+)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        if (src && src.startsWith('http')) {
          mirrors.push({ language, url: src });
        }
      }
    }
  }
  return mirrors;
}

function extractDirectIframes(html) {
  const urls = [];
  const regex = /<iframe[^>]+src="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    if (src && src !== 'about:blank' && src.startsWith('http')) {
      urls.push(src);
    }
  }
  return [...new Set(urls)];
}

async function getSeriesUrl(slug) {
  const patterns = [`${BASE_URL}/serie/${slug}/`, `${BASE_URL}/${slug}/`];
  for (const url of patterns) {
    try {
      const html = await fetchWithTimeout(url, { headers: HEADERS });
      if (!html || html.includes('404 Not Found')) continue;
      if (!html.includes('eps_lst') && !html.includes('listeps')) continue;
      const urlLabel = url.replace(BASE_URL, '');
      console.log(`[VerTeleSeries] ✓ Serie encontrada: ${urlLabel}`);
      return { url, html };
    } catch (e) {
      console.warn(`[VerTeleSeries] Serie ${url.replace(BASE_URL, '')} falló: ${e.message}`);
    }
  }
  return null;
}

async function searchResults(query) {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    const html = await fetchWithTimeout(searchUrl, { headers: HEADERS });
    const results = [];
    const linkRegex = /href="((?:https?:\/\/[^"]+?)?(?:\/serie\/|\/)[a-z0-9-]+(?:\/[^"']*)?)"/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      let url = match[1];
      if (url.startsWith('//')) url = `https:${url}`;
      if (!url.startsWith('http')) url = `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      if (!url.includes(BASE_URL)) continue;
      const path = url.replace(BASE_URL, '');
      if (path === '/' || path.includes('/category/') || path.includes('/genre/') || path.includes('/network/') || path.includes('/year/') || path.includes('/cast/')) continue;
      if (!results.includes(url)) results.push(url);
    }
    return results;
  } catch (e) {
    console.warn(`[VerTeleSeries] Error en búsqueda: ${e.message}`);
    return [];
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId || !mediaType || mediaType === 'movie' || mediaType === 'movies') return [];
  console.log(`[VerTeleSeries] Buscando: TMDB ${tmdbId} (${mediaType}) S${season || '?'}E${episode || '?'}`);

  try {
    const realId = cleanTmdbId(tmdbId);
    let mediaTitle = title;

    if (!mediaTitle && realId) {
      mediaTitle = await getTmdbTitle(realId, mediaType);
    }
    if (!mediaTitle) return [];

    const slug = buildSlug(mediaTitle);
    if (!slug) return [];

    let seriesPage = await getSeriesUrl(slug);
    if (!seriesPage) {
      console.log(`[VerTeleSeries] Slug directo falló, intentando búsqueda para: ${mediaTitle}`);
      let searchResultsList = await searchResults(mediaTitle);
      const slugMatch = searchResultsList.filter((r) => r.includes(`/${slug}/`));
      if (slugMatch.length > 0) searchResultsList = slugMatch;
      for (const result of searchResultsList) {
        try {
          const html = await fetchWithTimeout(result, { headers: HEADERS });
          if (!html || html.includes('404') || !html.includes('listeps')) continue;
          seriesPage = { url: result, html };
          console.log(`[VerTeleSeries] ✓ Encontrado vía búsqueda: ${result}`);
          break;
        } catch (e) {
          console.warn(`[VerTeleSeries] Error verificando ${result}: ${e.message}`);
        }
      }
    }

    if (!seriesPage) {
      console.log(`[VerTeleSeries] No se encontró la serie: ${mediaTitle}`);
      return [];
    }

    const episodeLinks = extractEpisodeLinks(seriesPage.html);
    const targetSeason = season ? parseInt(season, 10) : null;
    const targetEpisode = episode ? parseInt(episode, 10) : null;
    let episodeUrl = null;
    if (targetSeason && targetEpisode) {
      const found = episodeLinks.find(
        (l) => l.season === targetSeason && l.episode === targetEpisode
      );
      if (found) {
        episodeUrl = found.url;
        console.log(`[VerTeleSeries] ✓ Episodio S${targetSeason}xE${targetEpisode}: ${episodeUrl}`);
      }
    }

    if (!episodeUrl && episodeLinks.length > 0) {
      if (targetSeason) {
        const sameSeason = episodeLinks.find((l) => l.season === targetSeason);
        if (sameSeason) episodeUrl = sameSeason.url;
      }
      if (!episodeUrl) {
        episodeUrl = episodeLinks[0].url;
      }
      console.log(`[VerTeleSeries] Usando primer episodio: ${episodeUrl}`);
    }

    if (!episodeUrl) {
      console.log(`[VerTeleSeries] No se encontraron episodios`);
      return [];
    }

    const episodeHtml = await fetchWithTimeout(episodeUrl, { headers: HEADERS });
    if (!episodeHtml) return [];

    let mirrors = extractIframeFromMirrors(episodeHtml);
    if (mirrors.length === 0) {
      const directIframes = extractDirectIframes(episodeHtml);
      if (directIframes.length > 0) {
        mirrors = directIframes.map((url) => ({ language: 'Latino', url }));
      }
    }

    if (mirrors.length === 0) return [];

    const rawStreams = [];
    const langGroups = {};
    for (const mirror of mirrors) {
      if (!langGroups[mirror.language]) langGroups[mirror.language] = [];
      langGroups[mirror.language].push(mirror.url);
    }
    for (const [language, urls] of Object.entries(langGroups)) {
      const resolved = await parallelWithLimit(urls, async (embedUrl) => {
        try {
          const result = await resolveEmbed(embedUrl);
          if (result && result.url) {
            return {
              langLabel: language,
              url: result.url,
              quality: result.quality,
              headers: result.headers || {},
            };
          }
        } catch (e) {
          console.warn(`[VerTeleSeries] Error procesando embed: ${e.message}`);
        }
        return null;
      }, 5);
      rawStreams.push(...resolved.filter(Boolean));
    }

    return await finalizeStreams(rawStreams, 'VerTeleSeries', mediaTitle);
  } catch (e) {
    console.error(`[VerTeleSeries] Error: ${e.message}`);
    return [];
  }
}
