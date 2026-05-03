import { fetchJson } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';

const API_DEC = "https://enc-dec.app/api/dec-videasy";
const TMDB_API_KEY = "1c29a5198ee1854bd5eb45dbe8d17d92";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const SERVERS = {
    "Omen": { url: "https://api.videasy.net/lamovie/sources-with-title", label: "L-Movie", lang: "Latino" },
    "Gekko": { url: "https://api2.videasy.net/cuevana/sources-with-title", label: "Cuevana", lang: "Latino" },
    "Vimeos": { url: "https://api.videasy.net/vimeos/sources-with-title", label: "Vimeos", lang: "Latino" },
    "Raze": { url: "https://api.videasy.net/superflix/sources-with-title", label: "Superflix", lang: "Latino" }
};

const CINEBY_HEADERS = {
    "Accept": "*/*",
    "Origin": "https://cineby.sc",
    "Referer": "https://cineby.sc/",
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

const ANDROID_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
    "Referer": "https://player.videasy.net/",
    "Origin": "https://player.videasy.net"
};

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    try {
        const tmdbUrl = `${TMDB_BASE_URL}/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
        const tmdbData = await fetchJson(tmdbUrl);
        const contentTitle = tmdbData.title || tmdbData.name;
        const year = (tmdbData.release_date || tmdbData.first_air_date || "").split("-")[0];
        const doubleEncTitle = encodeURIComponent(encodeURIComponent(contentTitle));
        const imdbId = tmdbData.external_ids?.imdb_id || "";

        const serverPromises = Object.entries(SERVERS).map(async ([serverId, config]) => {
            try {
                let searchUrl = `${config.url}?title=${doubleEncTitle}&mediaType=${mediaType === "tv" ? "tv" : "movie"}&year=${year}&tmdbId=${tmdbId}&imdbId=${imdbId}`;
                if (mediaType === "tv")
                    searchUrl += `&episodeId=${episode || 1}&seasonId=${season || 1}`;
                const encryptedRes = await fetch(searchUrl, { headers: CINEBY_HEADERS });
                const encryptedText = await encryptedRes.text();
                if (!encryptedText || encryptedText.length < 20)
                    return [];
                const decRes = await fetch(API_DEC, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "User-Agent": CINEBY_HEADERS["User-Agent"] },
                    body: JSON.stringify({ text: encryptedText, id: String(tmdbId) })
                });
                const decData = await decRes.json();
                const mediaData = decData.result || decData;
                const localResults = [];
                if (mediaData && mediaData.sources) {
                    for (const source of mediaData.sources) {
                        if (source.url) {
                            let quality = (source.quality || "HD").toUpperCase();
                            if (quality === "AUTO")
                                quality = "1080p";
                            let audio = config.lang;
                            if (serverId === "Raze" && source.label) {
                                const label = source.label.toLowerCase();
                                if (label.includes("eng") || label.includes("en-us")) {
                                    audio = "Inglés";
                                }
                            }
                            localResults.push({
                                serverName: config.label,
                                audio,
                                quality,
                                url: source.url,
                                headers: serverId === "Raze" ? ANDROID_HEADERS : CINEBY_HEADERS
                            });
                        }
                    }
                }
                return localResults;
            } catch (err) {
                return [];
            }
        });

        const allResults = await Promise.all(serverPromises);
        const flattened = allResults.flat();
        return await finalizeStreams(flattened, "VidEasy Latino", "");
    } catch (error) {
        return [];
    }
}