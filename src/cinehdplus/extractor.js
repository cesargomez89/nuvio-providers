import { fetchJson, getSessionUA } from '../utils/http.js';
import { isMovie, cleanTmdbId } from '../utils/helpers.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];

    const rawId = cleanTmdbId(tmdbId) || tmdbId;

    let apiUrl = `https://cinehdplus.unbuendato.com/?id=${rawId}`;
    if (!isMovie(mediaType) && season && episode) {
        apiUrl += `&season=${season}&episode=${episode}`;
    }

    console.log(`[CineHDPlus] Fetching: ${apiUrl}`);

    try {
        const data = await fetchJson(apiUrl, {
            headers: {
                "User-Agent": getSessionUA()
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