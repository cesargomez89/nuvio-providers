import { fetchJson, getSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getTmdbInfo } from '../utils/tmdb.js';

const PHM_API = "https://api.playhubmax.com/api";
const UA = getSessionUA();
const API_HEADERS = {
    "User-Agent": UA,
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.playhubmax.com",
    "Referer": "https://www.playhubmax.com/"
};

const AES_KEY_STR = "33dff3b1c1362e45e1425fcc9724d6f3";
const AES_IV_STR = "33dff3b1c1362e45";

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
    } catch { return []; }
}

async function getSources(type, uuid) {
    try {
        const data = await fetchJson(`${PHM_API}/${type}/${uuid}/sources`, { headers: API_HEADERS });
        if (!data.data) return [];
        const sources = decryptSources(data.data);
        return sources.filter(s => s.languages?.includes("es"));
    } catch { return []; }
}

async function getContentDetail(uuid) {
    try {
        return await fetchJson(`${PHM_API}/en/contents/${uuid}`, { headers: API_HEADERS });
    } catch { return {}; }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[PlayHubMax] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        let mediaTitle = title;
        if (!mediaTitle && tmdbId) {
            const info = await getTmdbInfo(tmdbId, mediaType);
            mediaTitle = info?.title;
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
            } catch { return null; }
        }));
        const filtered = streams.filter(r => r !== null);
        return await finalizeStreams(filtered, "PlayHubMax", mediaTitle);
    } catch (error) {
        console.error(`[PlayHubMax] Error: ${error.message}`);
        return [];
    }
}