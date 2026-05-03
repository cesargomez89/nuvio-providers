import { fetchJson } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];

    const rawId = tmdbId.toString().includes(":") ? tmdbId.toString().split(":").find(x => !isNaN(x) && x.length > 0) : tmdbId;
    const isMovie = mediaType === "movie" || mediaType === "movies";

    let apiUrl = `https://cinehdplus.unbuendato.com/?id=${rawId}`;
    if (!isMovie && season && episode) {
        apiUrl += `&season=${season}&episode=${episode}`;
    }

    console.log(`[CineHDPlus] Fetching: ${apiUrl}`);

    try {
        const data = await fetchJson(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (!data.success || !data.data || !data.data.sources) {
            console.log("[CineHDPlus] Sin resultados");
            return [];
        }

        const rawStreams = [];
        const promises = [];

        for (const [langKey, servers] of Object.entries(data.data.sources)) {
            const lKey = langKey.toLowerCase();
            if (!lKey.includes("latino") && !lKey.includes("subtitulado") && !lKey.includes("sub"))
                continue;
            const langLabel = langKey.charAt(0).toUpperCase() + langKey.slice(1);

            for (const [serverKey, serverData] of Object.entries(servers)) {
                if (serverData.available && serverData.original_url) {
                    const sKey = serverKey.toLowerCase();
                    if (sKey.includes("netu") || sKey.includes("hqq") || sKey.includes("waaw"))
                        continue;

                    promises.push(
                        resolveEmbed(serverData.original_url).then(res => {
                            if (res) {
                                return {
                                    ...res,
                                    serverName: res.serverName || serverKey.charAt(0).toUpperCase() + serverKey.slice(1),
                                    lang: langLabel
                                };
                            }
                            return null;
                        }).catch(() => null)
                    );
                }
            }
        }

        const results = await Promise.all(promises);
        results.forEach(r => {
            if (r) rawStreams.push(r);
        });

        console.log(`[CineHDPlus] Found ${rawStreams.length} streams`);
        return await finalizeStreams(rawStreams, "CineHDPlus", data.data.title || title);
    } catch (e) {
        console.error(`[CineHDPlus] Error: ${e.message}`);
        return [];
    }
}