import { fetchJson, fetchHtml, getSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { getTmdbTitle, getTmdbAliases } from '../utils/tmdb.js';
import { resolveEmbed } from '../utils/resolvers.js';

const BASE = "https://www3.seriesmetro.net";
const UA3 = getSessionUA();
const HEADERS = {
    "User-Agent": UA3,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "es-US,es;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": BASE
};

function normalizeSlug(title) {
    if (!title) return "";
    return title.toLowerCase()
        .replace(/[áàäâ]/g, "a")
        .replace(/[éèëê]/g, "e")
        .replace(/[íìïî]/g, "i")
        .replace(/[óòöô]/g, "o")
        .replace(/[úùüû]/g, "u")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    
    const aliases = await getTmdbAliases(tmdbId, mediaType);
    let mediaTitle = title || aliases[0] || "";
    
    if (!mediaTitle) {
        mediaTitle = aliases[1] || aliases[0] || title;
    }
    if (!mediaTitle) {
        console.log(`[SeriesMetro] ✘ No title found for: ${tmdbId}`);
        return [];
    }
    
    console.log(`[SeriesMetro] Looking for: ${mediaTitle}`);
    
    const slugs = [];
    for (const t of [title, ...aliases].filter(Boolean)) {
        const slug = normalizeSlug(t);
        if (slug) slugs.push(slug);
    }
    const uniqueSlugs = [...new Set(slugs)].slice(0, 6);
    
    let seriesUrl = null;
    const typePrefix = mediaType === "movie" || mediaType === "movies" ? "pelicula" : "serie";
    const slugChecks = await Promise.all(
        uniqueSlugs.map(async (slug) => {
            const testUrl = `${BASE}/${typePrefix}/${slug}`;
            try {
                const response = await fetch(testUrl, { headers: HEADERS });
                if (response.ok) {
                    const html = await response.text();
                    if (!html.includes("404") && !html.includes("Not Found") && html.length > 1000) {
                        return testUrl;
                    }
                }
            } catch (e) {}
            return null;
        })
    );
    seriesUrl = slugChecks.find(r => r !== null);
    if (seriesUrl) {
        console.log(`[SeriesMetro] Found: ${seriesUrl}`);
    }
    
    if (!seriesUrl) {
        console.log(`[SeriesMetro] ✘ No content found for: ${mediaTitle}`);
        return [];
    }
    
    let episodeUrl = seriesUrl;
    if (mediaType === "tv" && season && episode) {
        const episodeSlug = `${normalizeSlug(mediaTitle)}-temporada-${season}-capitulo-${episode}`;
        episodeUrl = `${BASE}/capitulo/${episodeSlug}/`;
        
        try {
            const response = await fetch(episodeUrl, { headers: HEADERS });
            if (!response.ok) {
                const altSlug = `${normalizeSlug(aliases[0])}-temporada-${season}-capitulo-${episode}`;
                episodeUrl = `${BASE}/capitulo/${altSlug}/`;
            }
        } catch (e) {}
        
        console.log(`[SeriesMetro] Episode: ${episodeUrl}`);
    }
    
    try {
        const html = await fetchHtml(episodeUrl, { headers: { ...HEADERS, "Referer": seriesUrl } });
        
        const streams = [];
        const embedMatches = html.match(/data-src="([^"]+trembed=\d+[^"]*)"/g) || [];
        
        for (const match of embedMatches) {
            const embedUrl = match.match(/data-src="([^"]+)"/)?.[1];
            if (!embedUrl) continue;
            
            const cleanUrl = embedUrl.replace(/&amp;/g, "&");
            const fullUrl = cleanUrl.startsWith("http") ? cleanUrl : `${BASE}${cleanUrl}`;
            
            try {
                const epHtml = await fetchHtml(fullUrl, { headers: { ...HEADERS, "Referer": episodeUrl } });
                
                const iframeMatch = epHtml.match(/<iframe[^>]+src="([^"]+)"/);
                if (iframeMatch && iframeMatch[1]) {
                    let src = iframeMatch[1];
                    if (src.startsWith("//")) src = "https:" + src;
                    
                    const resolved = await resolveEmbed(src);
                    if (resolved && resolved.url) {
                        streams.push({
                            url: resolved.url,
                            quality: resolved.quality || "HD",
                            verified: resolved.verified || false,
                            langLabel: "Latino",
                            serverName: resolved.serverName || "SeriesMetro",
                            headers: resolved.headers || {}
                        });
                    }
                }
            } catch (e) {}
        }
        
        if (streams.length === 0) {
            const iframeSrcMatches = html.match(/<iframe[^>]+src="([^"]+)"/g) || [];
            for (const iframeTag of iframeSrcMatches) {
                const src = iframeTag.match(/src="([^"]+)"/)?.[1];
                if (!src || src.includes("facebook") || src.includes("google")) continue;
                
                let fullSrc = src;
                if (src.startsWith("//")) fullSrc = "https:" + src;
                
                const resolved = await resolveEmbed(fullSrc);
                if (resolved && resolved.url) {
                    streams.push({
                        url: resolved.url,
                        quality: resolved.quality || "HD",
                        verified: resolved.verified || false,
                        langLabel: "Latino",
                        serverName: resolved.serverName || "SeriesMetro",
                        headers: resolved.headers || {}
                    });
                }
            }
        }
        
        console.log(`[SeriesMetro] Found ${streams.length} streams`);
        return await finalizeStreams(streams, "SeriesMetro", mediaTitle);
    } catch (e) {
        console.log(`[SeriesMetro] Error: ${e.message}`);
        return [];
    }
}