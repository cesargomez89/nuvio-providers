import { fetchJson, setSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';

const API_DEC = "https://enc-dec.app/api/dec-videasy";
const TMDB_API_KEY = "d131017ccc6e5462a81c9304d21476de";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const SERVERS = {
    "Gekko": { url: "https://api2.videasy.net/cuevana/sources-with-title", label: "Cuevana" }
};

const CINEBY_HEADERS = {
    "Accept": "*/*",
    "Origin": "https://cineby.sc",
    "Referer": "https://cineby.sc/",
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[BrazucaPlay] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        setSessionUA(CINEBY_HEADERS["User-Agent"]);
        const tmdbUrl = `${TMDB_BASE_URL}/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
        const tmdbData = await fetchJson(tmdbUrl);
        const contentTitle = tmdbData.title || tmdbData.name;
        const year = (tmdbData.release_date || tmdbData.first_air_date || "").split("-")[0];
        const doubleEncTitle = encodeURIComponent(encodeURIComponent(contentTitle));
        const imdbId = tmdbData.external_ids?.imdb_id || "";
        const streams = [];
        for (const [serverId, config] of Object.entries(SERVERS)) {
            try {
                let searchUrl = `${config.url}?title=${doubleEncTitle}&mediaType=${mediaType === "tv" ? "tv" : "movie"}&year=${year}&tmdbId=${tmdbId}&imdbId=${imdbId}`;
                if (mediaType === "tv") {
                    searchUrl += `&episodeId=${episode || 1}&seasonId=${season || 1}`;
                }
                const encryptedRes = await fetch(searchUrl, { headers: CINEBY_HEADERS });
                const encryptedText = await encryptedRes.text();
                if (!encryptedText || encryptedText.length < 20) continue;
                const decRes = await fetch(API_DEC, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "User-Agent": CINEBY_HEADERS["User-Agent"] },
                    body: JSON.stringify({ text: encryptedText, id: String(tmdbId) })
                });
                const decData = await decRes.json();
                const mediaData = decData.result || decData;
                if (mediaData && mediaData.sources) {
                    for (const source of mediaData.sources) {
                        if (source.url) {
                            let quality = (source.quality || "HD").toUpperCase();
                            if (quality === "AUTO") quality = "1080p";
                            streams.push({
                                serverName: config.label,
                                audio: "Latino",
                                quality,
                                url: source.url,
                                headers: CINEBY_HEADERS
                            });
                        }
                    }
                }
            } catch (err) {
                console.log(`[BrazucaPlay] ${serverId} error: ${err.message}`);
            }
        }
        return await finalizeStreams(streams, "BrazucaPlay", contentTitle || "");
    } catch (error) {
        console.error(`[BrazucaPlay] Error: ${error.message}`);
        return [];
    }
}