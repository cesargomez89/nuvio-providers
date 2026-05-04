import { fetchJson, fetchHtml, getSessionUA, setSessionUA, getStealthHeaders } from '../utils/http.js';
import { padEpisode, cleanTmdbId } from '../utils/helpers.js';
import { validateStream } from '../utils/m3u8.js';
import { finalizeStreams } from '../utils/engine.js';
import { getCorrectImdbId } from '../utils/tmdb.js';
import { resolveEmbed } from '../utils/resolvers.js';

const BASE_URL = "https://embed69.org";

function decodeJwtPayload(token) {
    try {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        payload += '='.repeat((4 - payload.length % 4) % 4);
        return JSON.parse(atob(payload));
    } catch { return null; }
}

function applyPipingLocal(result) {
    if (!result || !result.url) return result;
    let url = result.url;
    const ua = result.headers?.["User-Agent"] || "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const headers = [`User-Agent=${ua}`, `Referer=${result.headers?.Referer || "https://embed69.org/"}`];
    if (result.headers?.Origin) headers.push(`Origin=${result.headers.Origin}`);
    url = `${url}|${headers.join("|")}`;
    if (!url.toLowerCase().includes(".m3u8") && !url.toLowerCase().includes(".mp4")) url += "#.m3u8";
    result.url = url;
    return result;
}

async function resolveEmbedLocal(url) {
    if (!url) return null;
    console.log(`[Embed69] Resolving: ${url}`);
    try {
        const res = await resolveEmbed(url);
        if (res && res.url) return applyPipingLocal(res);
        return applyPipingLocal({ url, quality: "HD", verified: false });
    } catch (err) {
        return applyPipingLocal({ url, quality: "HD", verified: false });
    }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[Embed69] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        const s = season !== undefined && season !== null ? parseInt(season) : null;
        const e = episode !== undefined && episode !== null ? parseInt(episode) : null;
        const currentUA = getSessionUA();
        setSessionUA(currentUA);
        const tmdbIdOnly = cleanTmdbId(tmdbId);
        const imdbInfo = await getCorrectImdbId(tmdbIdOnly, mediaType);
        if (!imdbInfo || !imdbInfo.imdbId) {
            console.log(`[Embed69] No IMDB ID found`);
            return [];
        }
        let displayTitle = title || "Contenido";
        if (imdbInfo && imdbInfo.title) displayTitle = imdbInfo.title;
        let urlSuffix = imdbInfo.imdbId;
        if (s !== null && e !== null) {
            const epPadded = padEpisode(e);
            urlSuffix = `${imdbInfo.imdbId}-${s}x${epPadded}`;
        }
        const url = `${BASE_URL}/f/${urlSuffix}`;
        console.log(`[Embed69] Searching: ${url}`);
        const response = await fetch(url, { method: "GET", headers: { "User-Agent": currentUA, "Referer": BASE_URL + "/" } });
        if (!response.ok) return [];
        const html = await response.text();
        const match = html.match(/let\s+dataLink\s*=\s*((\[[\s\S]*?\])|(\{[\s\S]*?\}))\s*;/);
        if (!match) return [];
        let rawData = JSON.parse(match[1].replace(/\\\//g, "/"));
        let data = Array.isArray(rawData) ? rawData : Object.values(rawData);

        const langMap = { "LAT": "Latino", "ESP": "Español", "SUB": "Subtitulado" };
        const langPriority = ["LAT", "ESP", "SUB"];

        const byLang = {};
        for (const item of data) {
            const vLang = (item.video_language || "LAT").toUpperCase();
            byLang[vLang] = item;
        }

        const streams = [];
        for (const lang of langPriority) {
            const item = byLang[lang];
            if (!item) continue;

            const currentLangLabel = langMap[lang] || "Latino";
            if (!item.sortedEmbeds || !Array.isArray(item.sortedEmbeds)) continue;

            const embeds = [];
            for (const embed of item.sortedEmbeds) {
                if (!embed.link) continue;
                const payload = decodeJwtPayload(embed.link);
                if (!payload || !payload.link) {
                    console.log(`[Embed69] JWT decode failed for ${embed.servername || 'unknown'}`);
                    continue;
                }
                embeds.push({ url: payload.link, servername: embed.servername });
            }

            if (embeds.length === 0) continue;

            console.log(`[Embed69] Resolving ${embeds.length} embeds (${lang})...`);
            const resolvedResults = await Promise.all(
                embeds.map(emb => resolveEmbedLocal(emb.url))
            );
            const resolved = resolvedResults
                .filter(result => result && result.url)
                .map(result => ({
                    serverName: result.serverName || "Server",
                    audio: currentLangLabel,
                    quality: result.quality || "HD",
                    url: result.url,
                    headers: result.headers || { "User-Agent": currentUA }
                }));

            if (resolved.length > 0) {
                streams.push(...resolved);
                console.log(`[Embed69] ✓ Streams found in ${lang}, stopping cascade`);
                break;
            } else {
                console.log(`[Embed69] No streams in ${lang}, trying next language...`);
            }
        }

        return await finalizeStreams(streams, "Embed69", displayTitle);
    } catch (error) {
        console.error(`[Embed69] Error: ${error.message}`);
        return [];
    }
}