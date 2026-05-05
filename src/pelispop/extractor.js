import { fetchHtml, getSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle, getTmdbAliases } from '../utils/tmdb.js';

const BASE_URL = "https://pelispop.mov";
const UA3 = getSessionUA();
const HEADERS = {
    "User-Agent": UA3,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": `${BASE_URL}/`
};

const FETCH_TIMEOUT = 10000;

function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    return fetchHtml(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

function getServerName(url) {
    if (url.includes("goodstream")) return "GoodStream";
    if (url.includes("hlswish") || url.includes("streamwish") || url.includes("strwish")) return "StreamWish";
    if (url.includes("voe.sx")) return "VOE";
    if (url.includes("filemoon")) return "Filemoon";
    if (url.includes("vimeos")) return "Vimeos";
    return "Online";
}

function b64decode(str) {
    try {
        if (typeof atob !== "undefined") return atob(str);
        return Buffer.from(str, "base64").toString("utf8");
    } catch (e) {
        return null;
    }
}

function normalizeTitle(t) {
    if (!t) return "";
    return t.toLowerCase()
        .replace(/[áàäâ]/g, "a")
        .replace(/[éèëê]/g, "e")
        .replace(/[íìïî]/g, "i")
        .replace(/[óòöô]/g, "o")
        .replace(/[úùüû]/g, "u")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function buildSlug(title) {
    return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function getMovieUrl(slug) {
    const slugsToTry = [slug, `${slug}-2`, `${slug}-3`, `${slug}-1`, `${slug}_2`, `${slug}_3`];
    const slugResults = await Promise.all(
        slugsToTry.map(async (s) => {
            const url = `${BASE_URL}/pelicula/${s}/`;
            try {
                const html = await fetchWithTimeout(url, { headers: HEADERS });
                if (!html || html.includes("404 Not Found") || !html.includes('id="btn_enlace"')) return null;
                console.log(`[PelisPop] ✓ Encontrado vía slug: /pelicula/${s}/`);
                return url;
            } catch (e) {}
            return null;
        })
    );
    return slugResults.find(r => r !== null);
}

async function getSeriesUrl(slug) {
    const url = `${BASE_URL}/serie/${slug}/`;
    try {
        const html = await fetchWithTimeout(url, { headers: HEADERS });
        if (!html || html.includes("404 Not Found") || !html.includes("Temporada")) return null;
        console.log(`[PelisPop] ✓ Encontrado serie: /serie/${slug}/`);
        return url;
    } catch (e) {
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
        const searchUrl = `${BASE_URL}/search?s=${normalizeTitle(title).replace(/\s+/g, "+")}`;
        const html = await fetchWithTimeout(searchUrl, { headers: HEADERS });
        const movies = [];
        const series = [];
        const linkRegex = /href="([^"]+\/(pelicula|serie)\/[^"]+)"/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            const url = match[1];
            const type = match[2];
            if (type === "pelicula" && !movies.includes(url)) movies.push(url);
            if (type === "serie") {
                const baseUrl = getBaseSeriesUrl(url);
                if (!series.includes(baseUrl)) series.push(baseUrl);
            }
        }
        return { movies, series };
    } catch (e) {
        console.log(`[PelisPop] Error en búsqueda: ${e.message}`);
        return { movies: [], series: [] };
    }
}

async function getEmbedUrls(movieUrl) {
    try {
        const html = await fetchWithTimeout(movieUrl, { headers: HEADERS });
        const embedUrls = [];
        const iframeRegex = /<iframe[^>]+src="([^"]+)"/g;
        let match;
        while ((match = iframeRegex.exec(html)) !== null) {
            const src = match[1];
            if (src && src.startsWith("http") && !src.includes("facebook") && !src.includes("google")) {
                embedUrls.push(src);
            }
        }
        if (embedUrls.length === 0) {
            const dataSrcRegex = /data-src="([A-Za-z0-9+/=]{20,})"/g;
            while ((match = dataSrcRegex.exec(html)) !== null) {
                const decoded = b64decode(match[1]);
                if (decoded && decoded.startsWith("http")) embedUrls.push(decoded);
            }
        }
        return [...new Set(embedUrls)];
    } catch (e) {
        console.log(`[PelisPop] Error obteniendo embeds: ${e.message}`);
        return [];
    }
}

async function processEmbed(embedUrl) {
    try {
        const result = await resolveEmbed(embedUrl);
        if (!result || !result.url) return null;
        return {
            langLabel: "Latino",
            serverLabel: getServerName(embedUrl),
            url: result.url,
            quality: result.quality,
            siteQuality: null,
            headers: result.headers || {}
        };
    } catch (e) {
        return null;
    }
}

async function getSeriesEmbedUrls(seriesUrl, season, episode) {
    try {
        const baseUrl = getBaseSeriesUrl(seriesUrl);
        const episodeUrl = season && episode
            ? `${baseUrl}temporada/${season}/capitulo/${episode}`
            : baseUrl;
        console.log(`[PelisPop] Obteniendo episode: ${episodeUrl}`);
        const html = await fetchWithTimeout(episodeUrl, { headers: HEADERS });
        if (!html || html.includes("404 Not Found") || html.includes("Extraviado")) return [];
        const embedUrls = [];
        const iframeRegex = /<iframe[^>]+src="([^"]+)"/g;
        let match;
        while ((match = iframeRegex.exec(html)) !== null) {
            const src = match[1];
            if (src && src.startsWith("http") && !src.includes("facebook") && !src.includes("google")) {
                embedUrls.push(src);
            }
        }
        return [...new Set(embedUrls)];
    } catch (e) {
        console.log(`[PelisPop] Error obteniendo embeds de serie: ${e.message}`);
        return [];
    }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId || !mediaType) return [];
    const isMovie = mediaType === "movie" || mediaType === "movies";
    console.log(`[PelisPop] Buscando: TMDB ${tmdbId} (${mediaType})`);
    try {
        let mediaTitle = title;
        if (!mediaTitle && tmdbId) {
            mediaTitle = await getTmdbTitle(tmdbId, mediaType);
        }
        if (!mediaTitle) return [];
        const slug = buildSlug(mediaTitle);
        if (!slug) return [];
        let selectedUrl = null;
        if (isMovie) {
            selectedUrl = await getMovieUrl(slug);
        } else {
            selectedUrl = await getSeriesUrl(slug);
        }
        if (!selectedUrl) {
            console.log(`[PelisPop] Slug directo falló, intentando búsqueda para: ${mediaTitle}`);
            const search = await searchResults(mediaTitle);
            const results = isMovie ? search.movies : search.series;
            if (results.length > 0) {
                selectedUrl = results[0];
                console.log(`[PelisPop] ✓ Encontrado vía búsqueda: ${selectedUrl}`);
            }
        }
        if (!selectedUrl && tmdbId) {
            console.log(`[PelisPop] Iniciando rescate por Alias en paralelo...`);
            const aliases = await getTmdbAliases(tmdbId, mediaType);
            const filteredAliases = [...new Set(aliases.filter((alias) => {
                if (!alias || alias === mediaTitle) return false;
                return /^[a-zA-Z0-9\s\-\:\.\,¡!¿?áéíóúÁÉÍÓÚñÑ]+$/.test(alias);
            }))].slice(0, 5);
            if (filteredAliases.length > 0) {
                const BATCH_SIZE = 2;
                for (let i = 0; i < filteredAliases.length; i += BATCH_SIZE) {
                    const batch = filteredAliases.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.all(batch.map(async (alias) => {
                        const aliasSlug = buildSlug(alias);
                        if (isMovie) {
                            const urlBySlug = await getMovieUrl(aliasSlug);
                            if (urlBySlug) return urlBySlug;
                            const aliasResults = await searchResults(alias);
                            return aliasResults.movies.length > 0 ? aliasResults.movies[0] : null;
                        } else {
                            const urlBySlug = await getSeriesUrl(aliasSlug);
                            if (urlBySlug) return urlBySlug;
                            const aliasResults = await searchResults(alias);
                            return aliasResults.series.length > 0 ? aliasResults.series[0] : null;
                        }
                    }));
                    selectedUrl = batchResults.find((url) => url !== null);
                    if (selectedUrl) break;
                }
                if (selectedUrl) {
                    console.log(`[PelisPop] ✓ Encontrado vía rescate paralelo: ${selectedUrl}`);
                }
            }
        }
        if (!selectedUrl) {
            console.log(`[PelisPop] No se encontró${isMovie ? " la película" : " la serie"}: ${mediaTitle}`);
            return [];
        }
        let embedUrls;
        if (isMovie) {
            embedUrls = await getEmbedUrls(selectedUrl);
        } else {
            embedUrls = await getSeriesEmbedUrls(selectedUrl, season, episode);
        }
        if (embedUrls.length === 0) return [];
        const streams = (await Promise.allSettled(embedUrls.map(processEmbed))).filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
        return await finalizeStreams(streams, "PelisPop", mediaTitle);
    } catch (e) {
        console.log(`[PelisPop] Error: ${e.message}`);
        return [];
    }
}