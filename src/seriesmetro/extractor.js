import { fetchJson, fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { getTmdbTitle, getTmdbAliases } from './tmdb.js';

const BASE = "https://www3.seriesmetro.net";
const UA3 = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HEADERS = {
    "User-Agent": UA3,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "es-US,es;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": BASE
};

async function findContentUrl(tmdbInfo, mediaType) {
    const searchTitles = [tmdbInfo.title, ...(tmdbInfo.aliases || [])].filter(Boolean);
    const cleanTitle = searchTitles[0]?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "";
    const cleanOriginal = (tmdbInfo.originalTitle || "").toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    
    const searchUrl = `${BASE}/search/${cleanTitle}`;
    try {
        const html = await fetchHtml(searchUrl, { headers: HEADERS });
        const firstMatch = html.match(/<a href="([^"]+)" class="MovieItem[^>]*>/i);
        if (firstMatch) return { url: firstMatch[1], html };
        
        if (cleanOriginal && cleanOriginal !== cleanTitle) {
            const altUrl = `${BASE}/search/${cleanOriginal}`;
            const altHtml = await fetchHtml(altUrl, { headers: HEADERS });
            const altMatch = altHtml.match(/<a href="([^"]+)" class="MovieItem[^>]*>/i);
            if (altMatch) return { url: altMatch[1], html: altHtml };
        }
        
        for (const altTitle of searchTitles.slice(2)) {
            const altSearch = altTitle.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
            if (altSearch === cleanTitle || altSearch === cleanOriginal) continue;
            const url = `${BASE}/search/${altSearch}`;
            const h = await fetchHtml(url, { headers: HEADERS });
            const m = h.match(/<a href="([^"]+)" class="MovieItem[^>]*>/i);
            if (m) return { url: m[1], html: h };
        }
    } catch (e) {
        console.log(`[SeriesMetro] Search error: ${e.message}`);
    }
    return null;
}

async function getEpisodeUrl(seriesUrl, seriesHtml, season, episode) {
    const url = `${seriesUrl.replace(/\/$/, "")}/season-${season}-episode-${episode}`;
    try {
        const epHtml = await fetchHtml(url, { headers: HEADERS });
        if (epHtml.includes("404") || epHtml.includes("Not Found")) return null;
        return epHtml.includes("embed") ? url : null;
    } catch {
        return null;
    }
}

async function extractEmbedStreams(targetUrl, refererUrl) {
    const streams = [];
    try {
        const html = await fetchHtml(targetUrl, { headers: { ...HEADERS, "Referer": refererUrl } });
        const serverMatches = html.match(/data-server="(\d+)"/g) || [];
        
        for (const serverAttr of serverMatches) {
            const serverId = serverAttr.match(/data-server="(\d+)"/)?.[1];
            if (!serverId) continue;
            
            const ajaxUrl = `${BASE}/ajax/e/${serverId}`;
            try {
                const ajaxData = await fetchJson(ajaxUrl, { 
                    method: "POST",
                    data: new URLSearchParams({ id: serverId }),
                    headers: { ...HEADERS, "Referer": targetUrl, "X-Requested-With": "XMLHttpRequest" }
                });
                
                if (ajaxData?.embedUrl) {
                    const { resolveEmbed } = await import('../utils/resolvers.js');
                    const resolved = await resolveEmbed(ajaxData.embedUrl);
                    if (resolved) {
                        streams.push({
                            ...resolved,
                            lang: "Latino",
                            serverLabel: "SeriesMetro"
                        });
                    }
                }
            } catch (e) {
                // skip
            }
        }
    } catch (e) {
        console.log(`[SeriesMetro] Extract error: ${e.message}`);
    }
    return streams;
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    
    const aliases = await getTmdbAliases(tmdbId, mediaType);
    let tmdbInfo = { title: title || aliases[0] || "" };
    
    if (!tmdbInfo.title) {
        tmdbInfo = {
            title: aliases[1] || aliases[0] || title,
            originalTitle: aliases[0] || title,
            aliases
        };
    }
    if (!tmdbInfo.title) return [];
    
    const found = await findContentUrl(tmdbInfo, mediaType);
    if (!found) {
        console.log(`[SeriesMetro] ✘ No se encontró contenido para: ${tmdbInfo.title}`);
        return [];
    }
    
    let targetUrl = found.url;
    if (mediaType === "tv" && season && episode) {
        const epUrl = await getEpisodeUrl(found.url, found.html, season, episode);
        if (!epUrl) return [];
        targetUrl = epUrl;
    }
    
    const streams = await extractEmbedStreams(targetUrl, found.url);
    return await finalizeStreams(streams, "SeriesMetro", tmdbInfo.title);
}