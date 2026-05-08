import { getTmdbTitle, getCorrectImdbId } from '../utils/tmdb.js';
import { padEpisode } from '../utils/helpers.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { finalizeStreams } from '../utils/engine.js';

const BASE_URL = "https://xupalace.org";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

const HTML_HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html",
    "Accept-Language": "es-MX,es;q=0.9",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache"
};

function getXuSlugs(imdbId, title) {
    const variants = [];
    if (imdbId)
        variants.push(imdbId);
    if (title) {
        const titleUpper = title.toUpperCase();
        const fullSlug = titleUpper.replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (fullSlug)
            variants.push(fullSlug);
        if (titleUpper.startsWith("THE ")) {
            const noThe = titleUpper.replace("THE ", "").replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
            if (noThe)
                variants.push(noThe);
        }
        const firstWord = titleUpper.split(" ")[0].replace(/[^A-Z0-9]/g, "");
        if (firstWord && firstWord !== "THE")
            variants.push(firstWord);
    }
    return [...new Set(variants)];
}

async function getEmbeds(slug, mediaType, season, episode) {
    try {
        const path = mediaType === "movie" || mediaType === "movies" 
            ? `/video/${slug}/` 
            : `/video/${slug}-${season}x${padEpisode(episode)}/`;
        const response = await fetch(`${BASE_URL}${path}`, {
            signal: AbortSignal.timeout(4500),
            headers: HTML_HEADERS
        });
        const html = await response.text();
        const matches = [...html.matchAll(/go_to_playerVast\('(https?:\/\/[^']+)'[^)]+\)[^<]*data-lang="(\d+)"/g)];
        if (matches.length === 0) {
            const fallback = [...html.matchAll(/go_to_playerVast\('(https?:\/\/[^']+)'/g)];
            if (fallback.length === 0)
                return null;
            return { 0: [...new Set(fallback.map((m) => m[1]))], _slug: slug };
        }
        const byLang = { _slug: slug };
        let hasData = false;
        for (const m of matches) {
            const url = m[1];
            const lang = parseInt(m[2]);
            if (!byLang[lang])
                byLang[lang] = [];
            if (!byLang[lang].includes(url)) {
                byLang[lang].push(url);
                hasData = true;
            }
        }
        return hasData ? byLang : null;
    } catch {
        return null;
    }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId)
        return [];
    let mediaTitle = title || await getTmdbTitle(tmdbId, mediaType);
    const LANG_NAMES = { 0: "Latino", 1: "Español", 2: "Subtitulado" };
    try {
        const { imdbId } = await getCorrectImdbId(tmdbId, mediaType);
        const slugVariants = getXuSlugs(imdbId, mediaTitle);
        console.log(`[XuPalace Turbo] Lanzando ${slugVariants.length} búsquedas en paralelo...`);
        const searchPromises = slugVariants.map((s) => getEmbeds(s, mediaType, season, episode));
        const resultsPool = await Promise.all(searchPromises);
        let winner = null;
        for (const res of resultsPool) {
            if (res && Object.keys(res).length > 1) {
                winner = res;
                break;
            }
        }
        if (!winner)
            return [];
        console.log(`[XuPalace Turbo] Ganador: ${winner._slug}. Resolviendo enlaces...`);
        let allStreams = [];
        for (const lang of [0, 1, 2]) {
            const urls = winner[lang];
            if (!urls || urls.length === 0)
                continue;
            const langName = LANG_NAMES[lang];
            const resolutionResults = await Promise.allSettled(
                urls.map(async (url) => {
                    try {
                        const result = await resolveEmbed(url);
                        if (result) {
                            return {
                                langLabel: langName,
                                serverLabel: result.serverName || "Online",
                                url: result.url,
                                quality: result.quality || "1080p",
                                verified: result.verified ?? true,
                                headers: result.headers || {}
                            };
                        }
                    } catch {
                    }
                    return null;
                })
            );
            const valid = resolutionResults.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
            if (valid.length > 0) {
                allStreams.push(...valid);
                if (lang === 0)
                    break;
            }
        }
        return await finalizeStreams(allStreams, "XuPalace", mediaTitle);
    } catch {
        return [];
    }
}