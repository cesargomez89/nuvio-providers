import { fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbInfo, getTmdbTitle } from '../utils/tmdb.js';
import { isMovie, cleanTmdbId } from '../utils/helpers.js';
import { buildSlug } from '../utils/title.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE_URL = 'https://www2.gnula.one';
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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

function extractLanguageFromEm(text) {
  const parts = text.split(',').map((p) => p.trim());
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (
      lower === 'latino' ||
      lower === 'castellano' ||
      lower === 'vose' ||
      lower === 'subtitulado' ||
      lower === 'español'
    ) {
      return part;
    }
  }
  return 'Latino';
}

function extractQualityFromEm(text) {
  const parts = text.split(',').map((p) => p.trim());
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower.includes('1080') || lower === 'fhd') return '1080p';
    if (lower.includes('720') || lower === 'hd') return '720p';
    if (lower.includes('4k')) return '4K';
    if (lower.includes('cam')) return 'CAM';
  }
  return 'HD';
}

function extractIframeUrls(html) {
  const urls = [];
  const regex = /<iframe[^>]+src="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    if (src && src !== 'about:blank' && src.startsWith('http') && !src.includes('facebook')) {
      urls.push(src);
    }
  }
  const lazyRegex = /data-lazy-src="([^"]+)"/g;
  while ((match = lazyRegex.exec(html)) !== null) {
    const src = match[1];
    if (src && src.startsWith('http') && !src.includes('facebook')) {
      urls.push(src);
    }
  }
  return [...new Set(urls)];
}

function parseEmSections(html) {
  const sections = [];
  const emRegex = /<em>([^<]+)<\/em>/g;
  let emMatch;
  const emPositions = [];
  while ((emMatch = emRegex.exec(html)) !== null) {
    const text = emMatch[1].trim();
    if (/opción/i.test(text)) {
      emPositions.push({ text, index: emMatch.index });
    }
  }
  for (let i = 0; i < emPositions.length; i++) {
    const current = emPositions[i];
    const next = emPositions[i + 1];
    const start = current.index;
    const end = next ? next.index : html.length;
    const sectionHtml = html.substring(start, end);
    const language = extractLanguageFromEm(current.text);
    const quality = extractQualityFromEm(current.text);
    const iframeUrls = extractIframeUrls(sectionHtml);
    if (iframeUrls.length > 0) {
      sections.push({ language, quality, urls: iframeUrls });
    }
  }
  return sections;
}

async function getMovieUrl(slug, expectedYear) {
  const slugsToTry = [slug, `${slug}-2`, `${slug}-3`, `${slug}-1`, `${slug}_2`];
  for (const s of slugsToTry) {
    const url = `${BASE_URL}/movie/${s}/`;
    try {
      const html = await fetchWithTimeout(url, { headers: HEADERS });
      if (
        !html ||
        html.includes('404 Not Found') ||
        !html.includes('class="iframes"') ||
        !html.includes('contenedor_tab')
      ) {
        continue;
      }
      if (expectedYear) {
        const yearRegex = new RegExp(`\\(${expectedYear}\\)`);
        if (!yearRegex.test(html)) continue;
      }
      console.log(`[GnulaHD] ✓ Encontrado vía slug: /movie/${s}/`);
      return { url, html };
    } catch (e) {
      console.warn(`[GnulaHD] Slug /movie/${s}/ falló: ${e.message}`);
    }
  }
  return null;
}

async function searchResults(title) {
  try {
    const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(title)}`;
    const html = await fetchWithTimeout(searchUrl, { headers: HEADERS });
    const results = [];
    const linkRegex = /href="([^"]*\/movie\/[^"]+)"/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const fullUrl = url.startsWith('http')
        ? url
        : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      if (!results.includes(fullUrl)) results.push(fullUrl);
    }
    return results;
  } catch (e) {
    console.warn(`[GnulaHD] Error en búsqueda: ${e.message}`);
    return [];
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId || !mediaType) return [];
  const isMovieType = isMovie(mediaType);
  console.log(`[GnulaHD] Buscando: TMDB ${tmdbId} (${mediaType})`);

  try {
    const realId = cleanTmdbId(tmdbId);
    let mediaTitle = title;
    let releaseYear = null;

    if (realId) {
      const info = await getTmdbInfo(realId, mediaType, 'es-MX');
      if (info) {
        releaseYear = info.year;
        if (!mediaTitle) mediaTitle = info.title;
      }
    }
    if (!mediaTitle && realId) {
      mediaTitle = await getTmdbTitle(realId, mediaType);
    }
    if (!mediaTitle) return [];

    const slug = buildSlug(mediaTitle);
    if (!slug) return [];

    let pageData = null;

    if (isMovieType) {
      pageData = await getMovieUrl(slug, releaseYear);
    }

    if (!pageData && isMovieType) {
      console.log(`[GnulaHD] Slug directo falló, intentando búsqueda para: ${mediaTitle}`);
      const searchResultsList = await searchResults(mediaTitle);
      for (const result of searchResultsList) {
        try {
          const html = await fetchWithTimeout(result, { headers: HEADERS });
          if (!html || html.includes('404 Not Found') || !html.includes('class="iframes"'))
            continue;
          if (releaseYear) {
            const yearRegex = new RegExp(`\\(${releaseYear}\\)`);
            if (!yearRegex.test(html)) continue;
          }
          pageData = { url: result, html };
          console.log(`[GnulaHD] ✓ Encontrado vía búsqueda: ${result}`);
          break;
        } catch (e) {
          console.warn(`[GnulaHD] Error verificando ${result}: ${e.message}`);
        }
      }
    }

    if (!pageData) {
      console.log(`[GnulaHD] No se encontró: ${mediaTitle}`);
      return [];
    }

    const sections = parseEmSections(pageData.html);
    if (sections.length === 0) return [];

    const rawStreams = [];
    for (const section of sections) {
      const resolved = await parallelWithLimit(
        section.urls,
        async (embedUrl) => {
          try {
            const result = await resolveEmbed(embedUrl);
            if (result && result.url) {
              return {
                langLabel: section.language,
                url: result.url,
                quality: result.quality || section.quality,
                headers: result.headers || {},
                ...(result.verified && { verified: true }),
                ...(result.isReal && { isReal: true }),
              };
            }
          } catch (e) {
            console.warn(`[GnulaHD] Error procesando embed: ${e.message}`);
          }
          return null;
        },
        5
      );
      rawStreams.push(...resolved.filter(Boolean));
    }

    return await finalizeStreams(rawStreams, 'GnulaHD', mediaTitle);
  } catch (e) {
    console.error(`[GnulaHD] Error: ${e.message}`);
    return [];
  }
}
