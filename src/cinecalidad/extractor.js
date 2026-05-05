import { request, fetchHtml, getSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle, getTmdbAliases, getTmdbInfo } from '../utils/tmdb.js';

const BASE_URL = "https://www.cinecalidad.vg";
const UA3 = getSessionUA();
const HEADERS = {
    "User-Agent": UA3,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": `${BASE_URL}/`
};

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

function buildSlug(title) {
    return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function getMovieUrl(slug, expectedYear) {
    const slugsToTry = [slug, `${slug}-2`, `${slug}-3`];
    const slugResults = await Promise.all(
        slugsToTry.map(async (s) => {
            const url = `${BASE_URL}/pelicula/${s}/`;
            try {
                const res = await request(url, { headers: HEADERS });
                if (!res || !res.ok) return null;
                const html = await res.text();
                if (html.includes("404 Not Found") || !html.includes('id="btn_enlace"')) return null;
                const yearMatch = html.match(/<h1[^>]*>[^<]*\((\d{4})\)[^<]*<\/h1>/);
                const year = yearMatch ? yearMatch[1] : null;
                if (!year || !expectedYear || year === expectedYear) {
                    console.log(`[CineCalidad] ✓ Encontrado vía slug: /pelicula/${s}/ (${year || "?"})`);
                    return url;
                }
            } catch (e) {}
            return null;
        })
    );
    return slugResults.find(r => r !== null);
}

async function searchResults(title) {
    try {
        const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(title)}`;
        const res = await request(searchUrl, { headers: HEADERS });
        if (!res || !res.ok) return [];
        const html = await res.text();
        const results = [];
        const regex = /<article[^>]*>[\s\S]*?<a[^>]+href="([^"]+pelicula\/[^"]+)"/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
            if (!results.includes(match[1])) results.push(match[1]);
        }
        return results;
    } catch (e) {
        console.log(`[CineCalidad] Error en búsqueda: ${e.message}`);
        return [];
    }
}

function isKnownEmbed(url) {
    return true;
}

async function getEmbedUrls(movieUrl) {
    try {
        const data = await fetchHtml(movieUrl, { headers: HEADERS });
        const embedLinks = [];
        const regex = /data-src="([A-Za-z0-9+/=]{20,})"/g;
        let match;
        while ((match = regex.exec(data)) !== null) embedLinks.push(match[1]);
        const decodedUrls = [...new Set(
            embedLinks.map((b64) => b64decode(b64)).filter((url) => url && url.startsWith("http"))
        )];
        const directEmbeds = decodedUrls.filter(isKnownEmbed);
        const intermediateUrls = decodedUrls.filter((u) => !isKnownEmbed(u));
        const embedUrls = new Set(directEmbeds);
        if (intermediateUrls.length > 0) {
            await Promise.allSettled(intermediateUrls.map(async (decoded) => {
                try {
                    const midData = await fetchHtml(decoded, { headers: HEADERS });
                    let finalUrl = "";
                    const btnMatch = midData.match(/id="btn_enlace"[^>]*>[\s\S]*?href="([^"]+)"/);
                    if (btnMatch) finalUrl = btnMatch[1];
                    if (!finalUrl) {
                        const iframeMatch = midData.match(/<iframe[^>]+src="([^"]+)"/);
                        if (iframeMatch) finalUrl = iframeMatch[1];
                    }
                    if (!finalUrl && decoded.includes("/e/")) finalUrl = decoded;
                    if (finalUrl && finalUrl.startsWith("http")) embedUrls.add(finalUrl);
                } catch (e) {}
            }));
        }
        return [...embedUrls];
    } catch (e) {
        console.log(`[CineCalidad] Error obteniendo embeds: ${e.message}`);
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

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId || !mediaType || mediaType === "tv") return [];
    const startTime = Date.now();
    console.log(`[CineCalidad] Buscando: TMDB ${tmdbId} (${mediaType})`);
    try {
        let mediaTitle = title;
        let releaseYear = null;
        if (tmdbId) {
            const info = await getTmdbInfo(tmdbId, mediaType, 'es-MX');
            if (info) releaseYear = info.year;
        }
        if (!mediaTitle && tmdbId) {
            mediaTitle = await getTmdbTitle(tmdbId, mediaType);
        }
        if (!mediaTitle) return [];
        const slug = buildSlug(mediaTitle);
        let selectedUrl = await getMovieUrl(slug, releaseYear);
        if (!selectedUrl) {
            console.log(`[CineCalidad] Slug directo falló, intentando búsqueda interna para: ${mediaTitle}`);
            const foundResults = await searchResults(mediaTitle);
            if (foundResults.length > 0) {
                if (releaseYear) {
                    for (const result of foundResults) {
                        try {
                            const res = await request(result, { headers: HEADERS });
                            if (!res || !res.ok) continue;
                            const html = await res.text();
                            if (html.includes("404 Not Found")) continue;
                            const yearMatch = html.match(/<h1[^>]*>[^<]*\((\d{4})\)[^<]*<\/h1>/);
                            const pageYear = yearMatch ? yearMatch[1] : null;
                            if (!pageYear || pageYear === releaseYear) {
                                selectedUrl = result;
                                console.log(`[CineCalidad] ✓ Encontrado vía búsqueda: ${selectedUrl} (${pageYear || "?"})`);
                                break;
                            }
                        } catch (e) {}
                    }
                }
                if (!selectedUrl && !releaseYear) {
                    selectedUrl = foundResults[0];
                    console.log(`[CineCalidad] ✓ Encontrado vía búsqueda (fallback): ${selectedUrl}`);
                }
            }
        }
        if (!selectedUrl && tmdbId) {
            console.log(`[CineCalidad] Iniciando rescate por Alias en paralelo...`);
            const aliases = await getTmdbAliases(tmdbId, mediaType);
            const filteredAliases = [...new Set(aliases.filter((alias) => {
                if (!alias || alias === mediaTitle) return false;
                return /^[a-zA-Z0-9\s\-\:\.\,¡!¿?áéíóúÁÉÍÓÚñÑ]+$/.test(alias);
            }))].slice(0, 5);
            if (filteredAliases.length > 0) {
                const aliasPromises = filteredAliases.map(async (alias) => {
                    const aliasSlug = buildSlug(alias);
                    const urlBySlug = await getMovieUrl(aliasSlug, releaseYear);
                    if (urlBySlug) return urlBySlug;
                    const aliasResults = await searchResults(alias);
                    if (aliasResults.length > 0 && releaseYear) {
                        for (const result of aliasResults) {
                            try {
                                const res = await request(result, { headers: HEADERS });
                                if (!res || !res.ok) continue;
                                const html = await res.text();
                                if (html.includes("404 Not Found")) continue;
                                const yearMatch = html.match(/<h1[^>]*>[^<]*\((\d{4})\)[^<]*<\/h1>/);
                                const pageYear = yearMatch ? yearMatch[1] : null;
                                if (!pageYear || pageYear === releaseYear) {
                                    console.log(`[CineCalidad] ✓ Encontrado vía alias: ${result} (${pageYear || "?"})`);
                                    return result;
                                }
                            } catch (e) {}
                        }
                    }
                    return aliasResults.length > 0 && !releaseYear ? aliasResults[0] : null;
                });
                const parallelResults = await Promise.all(aliasPromises);
                selectedUrl = parallelResults.find((url) => url !== null);
                if (selectedUrl) {
                    console.log(`[CineCalidad] ✓ Encontrado vía rescate paralelo: ${selectedUrl}`);
                }
            }
        }
        if (!selectedUrl) {
            console.log(`[CineCalidad] No se encontró la película tras agotar alias para: ${mediaTitle}`);
            return [];
        }
        console.log(`[CineCalidad] ✓ Título confirmado: "${mediaTitle}"`);
        const embedUrls = await getEmbedUrls(selectedUrl);
        if (embedUrls.length === 0) return [];
        const uniqueEmbeds = [...new Set(embedUrls)];
        const streams = (await Promise.allSettled(uniqueEmbeds.map(processEmbed))).filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
        return await finalizeStreams(streams, "CineCalidad", mediaTitle);
    } catch (e) {
        console.log(`[CineCalidad] Error: ${e.message}`);
        return [];
    }
}
