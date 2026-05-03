import { fetchHtml, getSessionUA } from '../utils/http.js';
import { resolveEmbed, getDirectCdnHeaders } from '../utils/resolvers.js';
import { getTmdbTitle } from './tmdb.js';

const BASE = "https://pelispedia.mov";
const UA = getSessionUA();

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

export async function extractPlayerEmbeds(url) {
    try {
        const html = await fetchHtml(url, { headers: { Referer: BASE + "/" } });
        if (!html) return [];
        
        const $ = require('cheerio-without-node-native').load(html);
        const streams = [];
        const seenUrls = new Set();
        
        $(".player-content iframe").each((i, el) => {
            let iframeUrl = $(el).attr("src");
            if (iframeUrl && !seenUrls.has(iframeUrl)) {
                seenUrls.add(iframeUrl);
                const serverName = $(`#server-option-${i} .title`).text().trim() || "Servidor";
                streams.push({
                    servername: serverName,
                    url: iframeUrl,
                    language: "Latino",
                    quality: "1080p",
                    headers: { "User-Agent": UA, "Referer": url }
                });
            }
        });
        
        if (streams.length === 0) {
            const re = /<iframe[^>]+src="([^"]+)"/gi;
            let m;
            while ((m = re.exec(html)) !== null) {
                const iframeUrl = m[1];
                if (iframeUrl.includes("embed69") || iframeUrl.includes("xupalace")) {
                    if (!seenUrls.has(iframeUrl)) {
                        seenUrls.add(iframeUrl);
                        streams.push({
                            servername: iframeUrl.includes("embed69") ? "Embed69" : "Servidor",
                            url: iframeUrl,
                            language: "Latino",
                            quality: "1080p"
                        });
                    }
                }
            }
        }
        
        console.log(`[PelisPedia Extractor] Found ${streams.length} potential streams.`);
        return streams;
    } catch (e) {
        console.error("[PelisPedia Extractor] Error:", e.message);
        return [];
    }
}

async function resolveEmbed69(embedUrl) {
    try {
        const html = await fetchHtml(embedUrl, { headers: { Referer: BASE + "/" } });
        const jwtRegex = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
        const matches = html.match(jwtRegex) || [];
        const uniqueTokens = [...new Set(matches)];
        const results = [];
        
        for (const token of uniqueTokens) {
            if (token.length < 50) continue;
            try {
                const parts = token.split(".");
                if (parts.length < 2) continue;
                let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                payload += "=".repeat((4 - payload.length % 4) % 4);
                const decoded = atob(payload);
                const payloadObj = JSON.parse(decoded);
                
                if (payloadObj.link) {
                    const resolved = await resolveEmbed(payloadObj.link);
                    if (resolved && resolved.url) {
                        results.push({
                            ...resolved,
                            servername: resolved.servername || "Server"
                        });
                    }
                }
            } catch (e) {
                // Skip invalid tokens
            }
        }
        return results;
    } catch (e) {
        console.error("[PelisPedia] Embed69 error:", e.message);
        return [];
    }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId && !title) return [];
    
    let searchTitle = title;
    if (!searchTitle) {
        console.log(`[PelisPedia] Resolving title for ${tmdbId}...`);
        searchTitle = await getTmdbTitle(tmdbId, mediaType, "es-MX");
        if (!searchTitle) {
            searchTitle = await getTmdbTitle(tmdbId, mediaType, "en-US");
        }
    }
    
    if (!searchTitle) {
        console.log("[PelisPedia] Could not resolve title");
        return [];
    }
    
    console.log(`[PelisPedia] Looking for: ${searchTitle}`);
    
    try {
        const searchUrl = `${BASE}/search?s=${normalizeTitle(searchTitle).replace(/\s+/g, "+")}`;
        const html = await fetchHtml(searchUrl, { headers: { Referer: BASE + "/" } });
        
        const re = /href="(https:\/\/pelispedia\.mov\/(pelicula|serie)\/([^"]+))"/gi;
        const matches = [];
        let m;
        while ((m = re.exec(html)) !== null) {
            matches.push({ url: m[1], type: m[2], slug: m[3] });
        }
        
        if (matches.length === 0) {
            console.log("[PelisPedia] No results found");
            return [];
        }
        
        const best = matches[0];
        let targetUrl = best.url;
        
        if (best.type === "serie") {
            targetUrl = `${BASE}/serie/${best.slug}/temporada/${season || 1}/capitulo/${episode || 1}`;
        }
        
        console.log(`[PelisPedia] Found: ${targetUrl}`);
        
        const rawEmbeds = await extractPlayerEmbeds(targetUrl);
        const streams = [];
        
        for (const embed of rawEmbeds) {
            let currentUrl = embed.url;
            let resolved = null;
            
            if (currentUrl.includes("embed69")) {
                resolved = await resolveEmbed69(currentUrl);
            } else {
                resolved = await resolveEmbed(currentUrl);
            }
            
            if (resolved) {
                const results = Array.isArray(resolved) ? resolved : [resolved];
                for (const r of results) {
                    if (r.url) {
                        streams.push({
                            name: "PelisPedia",
                            title: `${r.quality || "1080p"} · Latino · ${r.servername || embed.servername || "Server"}`,
                            url: r.url,
                            headers: r.headers || getDirectCdnHeaders(r.url) || { "User-Agent": UA, "Referer": currentUrl }
                        });
                    }
                }
            }
        }
        
        return streams;
    } catch (e) {
        console.error("[PelisPedia] Error:", e.message);
        return [];
    }
}