/**
 * <Name> Extractor
 * Site-specific logic for finding video streams.
 */
import { fetchHtml, fetchJson, fetchWithTimeout, getSessionUA, DEFAULT_TIMEOUT } from '../utils/http.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { finalizeStreams } from '../utils/engine.js';
import { getTmdbInfo } from '../utils/tmdb.js';
import cheerio from 'cheerio-without-node-native';

export async function extractStreams(tmdbId, mediaType, season, episode) {
    // 1. Fetch TMDB metadata if needed
    // const info = await getTmdbInfo(tmdbId, mediaType);
    // const title = info?.title || "";

    // 2. Construct the search or video URL
    // const url = `https://example.com/search/${tmdbId}`;

    // 3. Fetch content (with automatic 8s timeout)
    // const html = await fetchWithTimeout(url);

    //    Or pass a custom timeout + signal for propagation:
    // const controller = new AbortController();
    // const html = await fetchWithTimeout(url, 8000, { signal: controller.signal });

    //    Resolve embeds with signal propagation:
    // const resolved = await resolveEmbed(embedUrl, controller.signal);

    // 4. Parse with Cheerio
    // const $ = cheerio.load(html);
    // const embedUrls = [];
    // $('.player iframe').each((_, el) => embedUrls.push($(el).attr('src')));

    // 5. Resolve embeds to direct streams
    // const rawStreams = [];
    // for (const embedUrl of embedUrls) {
    //     const resolved = await resolveEmbed(embedUrl);
    //     if (resolved && resolved.url) rawStreams.push(resolved);
    // }

    // 6. Finalize (sort, validate, normalize)
    // return await finalizeStreams(rawStreams, "ProviderName", title);

    return [];
}