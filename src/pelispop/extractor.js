import { fetchHtml, getStealthHeaders } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle, getTmdbAliases, getTmdbInfo } from '../utils/tmdb.js';
import { isMovie, cleanTmdbId, sleep, b64decode } from '../utils/helpers.js';
import { normalizeTitle, buildSlug } from '../utils/title.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE_URL = 'https://pelispop.mov';
const HEADERS = {
  ...getStealthHeaders(),
  'Accept-Language': 'es-MX,es;q=0.9',
  Referer: `${BASE_URL}/`,
};

const FETCH_TIMEOUT = 10000;

function fetchWithTimeout(url, options = {}) {
  const hasAbort = typeof AbortController !== 'undefined';
  const controller = hasAbort ? new AbortController() : null;
  const externalSignal = options.signal || null;
  const timeoutId = setTimeout(() => {
    if (controller) controller.abort();
  }, FETCH_TIMEOUT);
  if (externalSignal && controller) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }
  const opts = { ...options };
  delete opts.signal;
  return fetchHtml(url, hasAbort ? { ...opts, signal: controller.signal } : opts).finally(() =>
    clearTimeout(timeoutId)
  );
}

function isYearValid(html, expectedYear) {
  if (!expectedYear) return true;
  const dateMatch = html.match(/"datePublished"\s*:\s*"(\d{4})"/);
  const parenMatch = html.match(/\((\d{4})\)/);
  const pageYear = dateMatch ? dateMatch[1] : parenMatch ? parenMatch[1] : null;
  return !pageYear || pageYear === expectedYear;
}

async function getMovieUrl(slug, expectedYear) {
  const slugsToTry = [slug, `${slug}-2`, `${slug}-3`, `${slug}-1`, `${slug}_2`, `${slug}_3`];
  const slugResults = await Promise.all(
    slugsToTry.map(async (s) => {
      const url = `${BASE_URL}/pelicula/${s}/`;
      try {
        const html = await fetchWithTimeout(url, { headers: HEADERS });
        if (!html || html.includes('404 Not Found') || !html.includes('id="btn_enlace"'))
          return null;
        if (!isYearValid(html, expectedYear)) return null;
        console.log(`[PelisPop] ✓ Encontrado vía slug: /pelicula/${s}/`);
        return url;
      } catch (e) {
        console.warn(`[PelisPop] Slug /pelicula/${s}/ falló: ${e.message}`);
      }
      return null;
    })
  );
  return slugResults.find((r) => r !== null);
}

async function getSeriesUrl(slug) {
  const url = `${BASE_URL}/serie/${slug}/`;
  try {
    const html = await fetchWithTimeout(url, { headers: HEADERS });
    if (!html || html.includes('404 Not Found')) return null;
    if (
      !html.includes('Temporada') &&
      !html.includes('temporada') &&
      !html.includes('capitulo') &&
      !html.includes('Episodio')
    )
      return null;
    console.log(`[PelisPop] ✓ Encontrado serie: /serie/${slug}/`);
    return url;
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.warn(`[PelisPop] Serie /serie/${slug}/ falló: ${e.message}`);
    }
    return null;
  }
}

function getBaseSeriesUrl(url) {
  const match = url.match(/\/serie\/([^/]+)/);
  if (match) return `${BASE_URL}/serie/${match[1]}/`;
  return url;
}

async function searchResults(title) {
  try {
    const searchUrl = `${BASE_URL}/search?s=${normalizeTitle(title).replace(/\s+/g, '+')}`;
    const html = await fetchWithTimeout(searchUrl, { headers: HEADERS });
    const movies = [];
    const series = [];
    const linkRegex = /href="([^"]+\/(pelicula|serie)\/[^"]+)"/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const type = match[2];
      const fullUrl = url.startsWith('http')
        ? url
        : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      if (type === 'pelicula' && !movies.includes(fullUrl)) movies.push(fullUrl);
      if (type === 'serie') {
        const baseUrl = getBaseSeriesUrl(fullUrl);
        if (!series.includes(baseUrl)) series.push(baseUrl);
      }
    }
    return { movies, series };
  } catch (e) {
    console.warn(`[PelisPop] Error en búsqueda: ${e.message}`);
    return { movies: [], series: [] };
  }
}

const DEAD_DOMAINS = ['voe.sx', 'voe-unblock.com'];

function extractIframeUrls(html) {
  const urls = [];
  const iframeRegex = /<iframe[^>]+src="([^"]+)"/g;
  let match;
  while ((match = iframeRegex.exec(html)) !== null) {
    const src = match[1];
    if (!src || !src.startsWith('http')) continue;
    if (DEAD_DOMAINS.some((d) => src.includes(d))) continue;
    if (src.includes('facebook') || src.includes('google')) continue;
    urls.push(src);
  }
  return [...new Set(urls)];
}

async function getEmbedUrls(movieUrl) {
  try {
    const html = await fetchWithTimeout(movieUrl, { headers: HEADERS });
    let embedUrls = extractIframeUrls(html);
    if (embedUrls.length === 0) {
      const dataSrcRegex = /data-src="([A-Za-z0-9+/=]{20,})"/g;
      let match;
      while ((match = dataSrcRegex.exec(html)) !== null) {
        const decoded = b64decode(match[1]);
        if (decoded && decoded.startsWith('http')) embedUrls.push(decoded);
      }
    }
    return embedUrls;
  } catch (e) {
    console.warn(`[PelisPop] Error obteniendo embeds: ${e.message}`);
    return [];
  }
}

async function processEmbed(embedUrl, signal) {
  try {
    const result = await resolveEmbed(embedUrl, signal);
    if (!result || !result.url) return null;
    return {
      langLabel: 'Latino',
      url: result.url,
      quality: result.quality,
      headers: result.headers || {},
    };
  } catch (e) {
    if (e.name !== 'AbortError') {
      console.warn(`[PelisPop] Error procesando embed: ${e.message}`);
    }
    return null;
  }
}

async function getSeriesEmbedUrls(seriesUrl, season, episode) {
  try {
    const baseUrl = getBaseSeriesUrl(seriesUrl);
    const episodeUrl =
      season != null && episode != null
        ? `${baseUrl}temporada/${season}/capitulo/${episode}`
        : baseUrl;
    console.log(`[PelisPop] Obteniendo episode: ${episodeUrl}`);
    const html = await fetchWithTimeout(episodeUrl, { headers: HEADERS });
    if (!html || html.includes('404 Not Found') || html.includes('Extraviado')) return [];
    return extractIframeUrls(html);
  } catch (e) {
    console.warn(`[PelisPop] Error obteniendo embeds de serie: ${e.message}`);
    return [];
  }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  if (!tmdbId || !mediaType) return [];
  const isMovieType = isMovie(mediaType);
  console.log(`[PelisPop] Buscando: TMDB ${tmdbId} (${mediaType})`);

  const OVERALL_TIMEOUT = 30000;
  const mainController = new AbortController();
  const mainTimer = setTimeout(() => mainController.abort(), OVERALL_TIMEOUT);

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
    let selectedUrl = null;
    if (isMovieType) {
      selectedUrl = await getMovieUrl(slug, releaseYear);
    } else {
      selectedUrl = await getSeriesUrl(slug);
    }
    if (!selectedUrl) {
      console.log(`[PelisPop] Slug directo falló, intentando búsqueda para: ${mediaTitle}`);
      const search = await searchResults(mediaTitle);
      const results = isMovieType ? search.movies : search.series;
      if (results.length > 0) {
        if (releaseYear && isMovieType) {
          for (const result of results) {
            try {
              const html = await fetchWithTimeout(result, { headers: HEADERS });
              if (!html || html.includes('404 Not Found')) continue;
              if (isYearValid(html, releaseYear)) {
                selectedUrl = result;
                console.log(`[PelisPop] ✓ Encontrado vía búsqueda: ${selectedUrl}`);
                break;
              }
            } catch (e) {
              if (e.name !== 'AbortError') {
                console.warn(`[PelisPop] Error verificando año en ${result}: ${e.message}`);
              }
            }
          }
        }
        if (!selectedUrl && !releaseYear) {
          selectedUrl = results[0];
          console.log(`[PelisPop] ✓ Encontrado vía búsqueda: ${selectedUrl}`);
        }
      }
    }
    if (!selectedUrl && realId) {
      console.log(`[PelisPop] Iniciando rescate por Alias...`);
      const aliases = await getTmdbAliases(realId, mediaType);
      const filteredAliases = [
        ...new Set(
          aliases.filter((alias) => {
            if (!alias || alias === mediaTitle) return false;
            return /^[a-zA-Z0-9\s\-\:\.\,¡!¿?áéíóúÁÉÍÓÚñÑ]+$/.test(alias);
          })
        ),
      ].slice(0, 5);
      if (filteredAliases.length > 0) {
        const BATCH_SIZE = 2;
        for (let i = 0; i < filteredAliases.length; i += BATCH_SIZE) {
          await sleep(500);
          const batch = filteredAliases.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map(async (alias) => {
              const aliasSlug = buildSlug(alias);
              if (isMovieType) {
                const urlBySlug = await getMovieUrl(aliasSlug, releaseYear);
                if (urlBySlug) return urlBySlug;
                const aliasResults = await searchResults(alias);
                if (aliasResults.movies.length > 0 && releaseYear) {
                  for (const result of aliasResults.movies) {
                    try {
                      const html = await fetchWithTimeout(result, { headers: HEADERS });
                      if (!html || html.includes('404 Not Found')) continue;
                      if (isYearValid(html, releaseYear)) {
                        console.log(`[PelisPop] ✓ Encontrado vía alias: ${result}`);
                        return result;
                      }
                    } catch (e) {
                      if (e.name !== 'AbortError') {
                        console.warn(`[PelisPop] Error verificando alias ${alias}: ${e.message}`);
                      }
                    }
                  }
                }
                return aliasResults.movies.length > 0 && !releaseYear
                  ? aliasResults.movies[0]
                  : null;
              } else {
                const urlBySlug = await getSeriesUrl(aliasSlug);
                if (urlBySlug) return urlBySlug;
                const aliasResults = await searchResults(alias);
                return aliasResults.series.length > 0 ? aliasResults.series[0] : null;
              }
            })
          );
          selectedUrl = batchResults.find((url) => url !== null);
          if (selectedUrl) break;
        }
        if (selectedUrl) {
          console.log(`[PelisPop] ✓ Encontrado vía rescate paralelo: ${selectedUrl}`);
        }
      }
    }
    if (!selectedUrl) {
      console.log(
        `[PelisPop] No se encontró${isMovieType ? ' la película' : ' la serie'}: ${mediaTitle}`
      );
      return [];
    }
    console.log(`[PelisPop] ✓ Título confirmado: "${mediaTitle}"`);
    let embedUrls;
    if (isMovieType) {
      embedUrls = await getEmbedUrls(selectedUrl);
    } else {
      embedUrls = await getSeriesEmbedUrls(selectedUrl, season, episode);
    }
    if (embedUrls.length === 0) return [];
    const resolvedEmbeds = await parallelWithLimit(
      embedUrls,
      (url) => processEmbed(url, mainController.signal),
      5
    );
    const streams = resolvedEmbeds.filter(Boolean);
    return await finalizeStreams(streams, 'PelisPop', mediaTitle);
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log(`[PelisPop] Timeout tras ${OVERALL_TIMEOUT}ms`);
    } else {
      console.error(`[PelisPop] Error: ${e.message}`);
    }
    return [];
  } finally {
    clearTimeout(mainTimer);
  }
}
