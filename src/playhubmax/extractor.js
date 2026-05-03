import { fetchJson } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';

const PHM_API = "https://api.playhubmax.com/api";
const UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const API_HEADERS = {
    "User-Agent": UA,
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.playhubmax.com",
    "Referer": "https://www.playhubmax.com/"
};
const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

const AES_KEY_STR = "33dff3b1c1362e45e1425fcc9724d6f3";
const AES_IV_STR = "33dff3b1c1362e45";

async function getTmdbTitle(tmdbId, mediaType) {
    try {
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;
        const data = await fetchJson(url);
        return data.title || data.name || null;
    } catch (e) { return null; }
}

function decryptSources(b64) {
    try {
        const CryptoJS = require("crypto-js");
        const key = CryptoJS.enc.Utf8.parse(AES_KEY_STR);
        const iv = CryptoJS.enc.Utf8.parse(AES_IV_STR);
        const decrypted = CryptoJS.AES.decrypt(b64, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.log(`[PlayHubMax] AES Decrypt error: ${e.message}`);
        return [];
    }
}

async function searchContents(q) {
    try {
        const data = await fetchJson(`${PHM_API}/US/en/contents?q=${encodeURIComponent(q)}`, { headers: API_HEADERS });
        return data.data || [];
    } catch (e) { return []; }
}

async function getSources(type, uuid) {
    try {
        const data = await fetchJson(`${PHM_API}/${type}/${uuid}/sources`, { headers: API_HEADERS });
        if (!data.data) return [];
        const sources = decryptSources(data.data);
        return sources.filter(s => s.languages?.includes("es"));
    } catch (e) { return []; }
}

async function getContentDetail(uuid) {
    try {
        return await fetchJson(`${PHM_API}/en/contents/${uuid}`, { headers: API_HEADERS });
    } catch (e) { return {}; }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[PlayHubMax] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        let mediaTitle = title;
        if (!mediaTitle && tmdbId) {
            mediaTitle = await getTmdbTitle(tmdbId, mediaType);
        }
        if (!mediaTitle) return [];
        const type = mediaType === "series" || mediaType === "tv" ? "tv" : "movie";
        const candidates = await searchContents(mediaTitle);
        const match = candidates.find(c => c.title?.toLowerCase() === mediaTitle.toLowerCase());
        if (!match) return [];
        let finalSources = [];
        if (type === "tv") {
            const detail = await getContentDetail(match.uuid);
            const seasonObj = detail.seasons?.find(s => parseInt(s.seasonNumber) === parseInt(season));
            if (!seasonObj) return [];
            const episodes = await fetchJson(`${PHM_API}/en/episodes?season_id=${seasonObj.id}`, { headers: API_HEADERS });
            const ep = episodes.data?.find(e => parseInt(e.episodeNumber) === parseInt(episode));
            if (!ep) return [];
            finalSources = await getSources("episode", ep.uuid);
        } else {
            finalSources = await getSources("content", match.uuid);
        }
        const streams = await Promise.all(finalSources.map(async (s) => {
            try {
                const result = await resolveEmbed(s.url);
                const finalUrl = result?.url || s.url;
                return {
                    langLabel: "Latino",
                    serverLabel: s.hostName || "PlayHub",
                    url: finalUrl,
                    quality: "1080p",
                    headers: result?.headers || { "User-Agent": UA, "Referer": "https://www.playhubmax.com/" }
                };
            } catch (e) { return null; }
        }));
        const filtered = streams.filter(r => r !== null);
        return await finalizeStreams(filtered, "PlayHubMax", mediaTitle);
    } catch (error) {
        console.error(`[PlayHubMax] Error: ${error.message}`);
        return [];
    }
}