import { getSessionUA, CINEBY_HEADERS } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { getTmdbInfo, getCorrectImdbId } from '../utils/tmdb.js';

const API_DEC = "https://enc-dec.app/api/dec-videasy";

const SERVERS = {
    "Omen": { url: "https://api.videasy.net/lamovie/sources-with-title", label: "L-Movie", lang: "Latino" },
    "Gekko": { url: "https://api2.videasy.net/cuevana/sources-with-title", label: "Cuevana", lang: "Latino" },
    "Vimeos": { url: "https://api.videasy.net/vimeos/sources-with-title", label: "Vimeos", lang: "Latino" },
    "Raze": { url: "https://api.videasy.net/superflix/sources-with-title", label: "Superflix", lang: "Latino" }
};

const ANDROID_HEADERS = {
    "User-Agent": getSessionUA(),
    "Referer": "https://player.videasy.net/",
    "Origin": "https://player.videasy.net"
};

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    try {
        const tmdbInfo = await getTmdbInfo(tmdbId, mediaType);
        const contentTitle = tmdbInfo?.title || title;
        const year = tmdbInfo?.year || "";
        const { imdbId } = await getCorrectImdbId(tmdbId, mediaType);
        const doubleEncTitle = encodeURIComponent(encodeURIComponent(contentTitle));

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
            } catch {
                return [];
            }
        });

        const allResults = await Promise.all(serverPromises);
        const flattened = allResults.flat();
        return await finalizeStreams(flattened, "VidEasy Latino");
    } catch {
        return [];
    }
}