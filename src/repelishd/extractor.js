import { fetchHtml, getSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { cleanTmdbId, isMovie } from '../utils/helpers.js';

const BASE_URL = "https://repelishd.run";
const SEARCH_URL = `${BASE_URL}/?story={TMDB_ID}&do=search&subaction=search`;
const UA = getSessionUA();
const HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8"
};

async function searchContent(tmdbId) {
    const url = SEARCH_URL.replace("{TMDB_ID}", tmdbId);
    const html = await fetchHtml(url, { headers: HEADERS });
    const match = html.match(/<h3><a\s+href="([^"]*ver-pelicula\/[^"]+)"[^>]*>/);
    if (!match) return null;
    return match[1];
}

async function extractMovieEmbeds(pageUrl) {
    const html = await fetchHtml(pageUrl, { headers: HEADERS });
    const iframeMatch = html.match(/<iframe[^>]*src="(https?:\/\/verhdlink\.cam\/movie\/[^"]+)"/);
    if (!iframeMatch) return [];
    const verhdUrl = iframeMatch[1];
    const verhdHtml = await fetchHtml(verhdUrl, {
        headers: { ...HEADERS, "Referer": BASE_URL + "/" }
    });
    const embeds = [];
    const mirrorMatch = verhdHtml.match(/<ul class="_player-mirrors latino[^>]*>([\s\S]*?)<\/ul>/);
    if (mirrorMatch) {
        const allLinks = mirrorMatch[1].matchAll(/data-link="([^"]+)"/g);
        for (const m of allLinks) {
            let url = m[1];
            if (!url || url === "") continue;
            if (url.startsWith("//")) url = "https:" + url;
            embeds.push(url);
        }
    }
    return [...new Set(embeds)];
}

async function extractTvEmbeds(pageUrl, season, episode) {
    const html = await fetchHtml(pageUrl, { headers: HEADERS });
    const episodeId = `serie-${season}_${episode}`;
    const embeds = [];
    const epMatch = html.match(new RegExp(
        `<a[^>]*id="${episodeId}"[^>]*data-link="([^"]+)"`
    ));
    if (epMatch) embeds.push(epMatch[1]);
    const droploadRe = new RegExp(
        `<a[^>]*id="${episodeId}"[^>]*>.*?<a[^>]*data-m="dropload"[^>]*data-link="([^"]+)"`,
        's'
    );
    const dropMatch = html.match(droploadRe);
    if (dropMatch) embeds.push(dropMatch[1]);
    return [...new Set(embeds)];
}

export async function extractStreams(tmdbId, mediaType, season, episode) {
    if (!tmdbId) return [];
    console.log(`[RePelisHD] Looking for: ${tmdbId} (${mediaType})`);
    try {
        const realId = cleanTmdbId(tmdbId);
        const s = parseInt(season || 1);
        const e = parseInt(episode || 1);
        const contentUrl = await searchContent(realId);
        if (!contentUrl) {
            console.log(`[RePelisHD] No content found on site`);
            return [];
        }
        console.log(`[RePelisHD] Found page: ${contentUrl}`);
        let embedUrls;
        if (isMovie(mediaType)) {
            embedUrls = await extractMovieEmbeds(contentUrl);
        } else {
            embedUrls = await extractTvEmbeds(contentUrl, s, e);
        }
        if (!embedUrls || embedUrls.length === 0) {
            console.log(`[RePelisHD] No embeds found`);
            return [];
        }
        console.log(`[RePelisHD] Resolving ${embedUrls.length} embeds...`);
        const results = await Promise.all(embedUrls.map(async (url) => {
            try {
                const resolved = await resolveEmbed(url);
                if (resolved && resolved.url) {
                    return {
                        url: resolved.url,
                        serverName: resolved.serverName || "Server",
                        langLabel: "Latino",
                        quality: resolved.quality || "HD",
                        headers: resolved.headers || { "User-Agent": UA, "Referer": url }
                    };
                }
                return null;
            } catch { return null; }
        }));
        const validStreams = results.filter(r => r !== null);
        return await finalizeStreams(validStreams, "RePelisHD", "");
    } catch (error) {
        console.error(`[RePelisHD] Error: ${error.message}`);
        return [];
    }
}
