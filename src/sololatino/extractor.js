import { fetchHtml, getSessionUA, setSessionUA, getStealthHeaders } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbTitle } from '../utils/tmdb.js';
import { isMovie, cleanTmdbId } from '../utils/helpers.js';
import { parallelWithLimit } from '../utils/parallel.js';

const BASE = "https://sololatino.net";
const HEADERS = { ...getStealthHeaders(), "Accept-Language": "es-ES,es;q=0.9,en;q=0.8" };

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[SoloLatino] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        const realId = cleanTmdbId(tmdbId);
        setSessionUA(getSessionUA());

        let searchTitle = title;
        if (!searchTitle) {
            searchTitle = await getTmdbTitle(realId, mediaType);
        }
        if (!searchTitle) {
            console.log(`[SoloLatino] No title found for ${realId}`);
            return [];
        }

        const searchUrl = `${BASE}/buscar?q=${encodeURIComponent(searchTitle)}`;
        console.log(`[SoloLatino] Searching: ${searchUrl}`);
        const searchHtml = await fetchHtml(searchUrl, { headers: HEADERS });

        const targetId = realId.toString();
        const idIndex = searchHtml.indexOf(`data-movie-id="${targetId}"`);
        if (idIndex === -1) {
            console.log(`[SoloLatino] No match found for TMDB: ${targetId}`);
            return [];
        }

        const beforeSection = searchHtml.substring(0, idIndex);
        const hrefRegex = /<a\s+href="(https?:\/\/sololatino\.net\/(?:serie|pelicula)\/[^"]+)"/gi;
        let hrefMatch;
        let slugUrl = null;
        while ((hrefMatch = hrefRegex.exec(beforeSection)) !== null) {
            slugUrl = hrefMatch[1];
        }

        if (!slugUrl) {
            console.log(`[SoloLatino] Could not extract URL for TMDB: ${targetId}`);
            return [];
        }

        let finalUrl = slugUrl;
        if (!isMovie(mediaType)) {
            const s = parseInt(season || 1);
            const e = parseInt(episode || 1);
            finalUrl = finalUrl.replace(/\/$/, '') + `/temporada-${s}/episodio-${e}`;
        }

        console.log(`[SoloLatino] Fetching: ${finalUrl}`);
        const pageHtml = await fetchHtml(finalUrl, { headers: { ...HEADERS, "Referer": BASE } });

        const serverUrls = [];
        const serverRegex = /data-server-url="([^"]+)"/g;
        let sMatch;
        while ((sMatch = serverRegex.exec(pageHtml)) !== null) {
            serverUrls.push(sMatch[1]);
        }

        if (serverUrls.length === 0) {
            console.log(`[SoloLatino] No server URLs found`);
            return [];
        }

        console.log(`[SoloLatino] Found ${serverUrls.length} embeds, resolving...`);

        const resolvedEmbeds = await parallelWithLimit(serverUrls, async (url) => {
            try {
                const resolved = await resolveEmbed(url);
                if (resolved && resolved.url) {
                    return {
                        url: resolved.url,
                        language: "Latino",
                        serverLabel: resolved.serverName || "Servidor",
                        quality: resolved.quality || "1080p",
                        headers: resolved.headers || {}
                    };
                }
            } catch (e) {
                console.log(`[SoloLatino] Error resolving ${url}: ${e.message}`);
            }
            return null;
        }, 5);

        const streams = resolvedEmbeds.filter(Boolean);

        if (streams.length === 0) {
            console.log(`[SoloLatino] No streams could be resolved`);
            return [];
        }

        return await finalizeStreams(streams, "SoloLatino", searchTitle);

    } catch (error) {
        console.error(`[SoloLatino] Error: ${error.message}`);
        return [];
    }
}
