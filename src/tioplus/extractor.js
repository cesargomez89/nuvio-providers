import { fetchHtml, getSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';

const BASE_URL = "https://tioplus.app";
const UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

function toDoubleBase64(str) {
    try {
        if (typeof btoa !== "undefined") return btoa(str);
        return Buffer.from(str).toString("base64");
    } catch (e) { return ""; }
}

async function getTmdbInfo(tmdbId, mediaType) {
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;
        const res = await fetch(url);
        const data = await res.json();
        return {
            title: data.title || data.name,
            year: (data.release_date || data.first_air_date || "").split("-")[0]
        };
    } catch (e) { return null; }
}

async function getRedirectUrl(serverEncoded, referer) {
    try {
        const doubleB64 = toDoubleBase64(serverEncoded);
        const playerUrl = `${BASE_URL}/player/${doubleB64}`;
        const html = await fetchHtml(playerUrl, { headers: { "User-Agent": UA, "Referer": referer } });
        if (!html || html.length < 50) return null;
        const match = html.match(/(?:window\.)?location\.href\s*=\s*['"]([^'"]+)['"]/i);
        let finalUrl = match ? match[1] : null;
        if (finalUrl && finalUrl.includes("up.asdasd")) {
            const netuIdMatch = finalUrl.match(/\.site(.*?)$/);
            if (netuIdMatch) finalUrl = "https://netu.to" + netuIdMatch[1];
        }
        return finalUrl;
    } catch (e) { return null; }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId || !mediaType) return [];
    console.log(`[TioPlus] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        const tmdbInfo = await getTmdbInfo(tmdbId, mediaType);
        const mediaTitle = tmdbInfo?.title || title;
        const releaseYear = tmdbInfo?.year || "";
        if (!mediaTitle) return [];
        console.log(`[TioPlus] Searching: ${mediaTitle} (${releaseYear})`);
        const searchQuery = mediaTitle.split(/[:(]/)[0].trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const candidates = [];
        
        const typePrefix = mediaType === "movie" ? "pelicula" : "serie";
        const directUrl = `${BASE_URL}/${typePrefix}/${searchQuery}`;
        const directHtml = await fetchHtml(directUrl, { headers: { "User-Agent": UA } });
        if (directHtml && !directHtml.includes("404") && !directHtml.includes("Not Found") && directHtml.length > 1000) {
            candidates.push({ url: directUrl, title: mediaTitle });
        }
        
        if (candidates.length === 0) {
            const searchUrl = `${BASE_URL}/search/${encodeURIComponent(searchQuery)}`;
            const html = await fetchHtml(searchUrl, { headers: { "User-Agent": UA } });
            if (html) {
                const itemRegex = /<article[^>]*class=['"]item[^>]*>[\s\S]*?<a[^>]*href=['"]([^'"]+)['"][\s\S]*?<h2>([\s\S]*?)<\/h2>/gi;
                let match;
                while ((match = itemRegex.exec(html)) !== null) {
                    candidates.push({ url: match[1], title: match[2].trim() });
                }
            }
        }
        if (candidates.length === 0) return [];
        let targetUrl = null;
        let bestScore = -1;
        const keywords = mediaTitle.toLowerCase().split(/[: ]/).filter(w => w.length > 2);
        for (const cand of candidates) {
            const candTitle = cand.title.toLowerCase();
            let score = 0;
            if (keywords.length > 0 && candTitle.startsWith(keywords[0])) score += 10;
            keywords.forEach(word => { if (candTitle.includes(word)) score += 5; });
            if (releaseYear && cand.title.includes(`(${releaseYear})`)) score += 50;
            if (candTitle.includes(mediaTitle.toLowerCase())) score += 10;
            const isCorrectType = mediaType === "movie" && cand.url.includes("/pelicula/") || mediaType !== "movie" && cand.url.includes("/serie/");
            if (isCorrectType && score > bestScore) {
                bestScore = score;
                targetUrl = cand.url;
            }
        }
        if (bestScore < 10) return [];
        let finalMediaUrl = targetUrl;
        if (mediaType !== "movie") {
            const s = parseInt(season) || 1;
            const e = parseInt(episode) || 1;
            finalMediaUrl = `${targetUrl}/season/${s}/episode/${e}`;
        }
        const mediaHtml = await fetchHtml(finalMediaUrl, { headers: { "User-Agent": UA, "Referer": BASE_URL } });
        if (!mediaHtml) return [];
        const serverRegex = /data-server=['"]([^'"]+)['"][^>]*>[\s\S]*?<span>([^<]+)<\/span>/gi;
        let sMatch;
        const encodes = [];
        while ((sMatch = serverRegex.exec(mediaHtml)) !== null) {
            const enc = sMatch[1];
            const rawServerName = sMatch[2].split("-")[0].trim();
            if (rawServerName !== "Earnvids" && rawServerName !== "Plus") continue;
            let lang = "LAT";
            if (mediaHtml.includes("audio Latino") || mediaHtml.includes("Español Latino")) lang = "LAT";
            else if (mediaHtml.includes("audio Castellano") || mediaHtml.includes("Español España")) lang = "ESP";
            else if (mediaHtml.includes("subtulada") || mediaHtml.includes("Subtitu")) lang = "SUB";
            encodes.push({ enc, serverName: rawServerName, lang });
        }
        if (encodes.length === 0) return [];
        
        const resolutionPromises = encodes.map(async (item) => {
            try {
                const realEmbedUrl = await getRedirectUrl(item.enc, finalMediaUrl);
                if (realEmbedUrl && realEmbedUrl.startsWith("http")) {
                    const resolved = await resolveEmbed(realEmbedUrl);
                    if (resolved && (resolved.url || Array.isArray(resolved) && resolved.length > 0)) {
                        const streamsArray = Array.isArray(resolved) ? resolved : [resolved];
                        return streamsArray.map(s => ({
                            ...s,
                            serverLabel: item.serverName,
                            langLabel: item.lang === "LAT" ? "Latino" : item.lang === "ESP" ? "Español" : "Subtitulado"
                        }));
                    }
                }
            } catch (err) {}
            return [];
        });

        const allResolved = await Promise.allSettled(resolutionPromises);
        const resolvedStreams = [];
        allResolved.forEach(r => {
            if (r.status === 'fulfilled' && r.value) {
                resolvedStreams.push(...r.value);
            }
        });

        return await finalizeStreams(resolvedStreams, "TioPlus", mediaTitle);
    } catch (error) {
        console.error(`[TioPlus] Error: ${error.message}`);
        return [];
    }
}