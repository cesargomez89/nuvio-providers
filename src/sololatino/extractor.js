import { fetchHtml, getSessionUA, setSessionUA } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getCorrectImdbId } from '../utils/tmdb.js';
import { sleep, isMovie, cleanTmdbId } from '../utils/helpers.js';

const BASE_URL = "https://player.pelisserieshoy.com";
const UA = getSessionUA();
const HEADERS = {
    "User-Agent": UA,
    "Accept": "*/*",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sololatino.net/"
};

async function getDirectStream(id, token, cookie, playerUrl) {
    try {
        const body = `a=2&v=${id}&tok=${token}`;
        const config = {
            headers: { ...HEADERS, "Referer": playerUrl, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }
        };
        if (cookie) config.headers["cookie"] = cookie;
        const response = await fetch(`${BASE_URL}/s.php`, { method: "POST", body, ...config });
        const data = await response.json();
        if (data && data.u) {
            let videoUrl = data.u;
            if (data.sig) {
                videoUrl = `${BASE_URL}/p.php?url=${encodeURIComponent(data.u)}&sig=${data.sig}`;
            }
            if (videoUrl.includes("/api/source/")) {
                const domain = new URL(videoUrl).hostname;
                const apiRes = await fetch(videoUrl, {
                    method: "POST",
                    headers: { ...HEADERS, "Referer": playerUrl, "Content-Type": "application/x-www-form-urlencoded" },
                    body: `r=https%3A%2F%2Fre.sololatino.net%2F&d=${domain}`
                });
                const apiData = await apiRes.json();
                if (apiData.success && apiData.data && apiData.data.length > 0) {
                    videoUrl = apiData.data[apiData.data.length - 1].file;
                }
            }
            if (!videoUrl.startsWith("http")) {
                videoUrl = BASE_URL + videoUrl;
            }
            return videoUrl;
        }
        return null;
    } catch (e) { return null; }
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[SoloLatino] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        const realId = cleanTmdbId(tmdbId);
        const s = parseInt(season || 1);
        const e = parseInt(episode || 1);
        setSessionUA(UA);
        const { imdbId } = await getCorrectImdbId(realId, mediaType);
        if (!imdbId) {
            console.log(`[SoloLatino] No IMDB ID found`);
            return [];
        }
        const epStr = e < 10 ? `0${e}` : e;
        const slug = isMovie(mediaType) ? imdbId : `${imdbId}-${s}x${epStr}`;
        const playerUrl = `${BASE_URL}/f/${slug}`;
        console.log(`[SoloLatino] Fetching: ${playerUrl}`);
        const response = await fetch(playerUrl, { headers: HEADERS });
        const html = await response.text();
        const cookies = response.headers.get("set-cookie") || "";
        const cookie = cookies.split(";").map(c => c.split(";")[0]).join("; ");
        const tokenMatch = html.match(/(?:let\s+token|const\s+_t|tok|_t|token)\s*.*['"]([a-f0-9]{32})['"]/);
        if (!tokenMatch) {
            console.log(`[SoloLatino] No token found`);
            return [];
        }
        const token = tokenMatch[1];
        const postH = { ...HEADERS, "Referer": playerUrl, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" };
        if (cookie) postH["cookie"] = cookie;
        await fetch(`${BASE_URL}/s.php`, { method: "POST", body: "a=click&tok=" + token, headers: postH }).catch(() => {});
        const scanResponse = await fetch(`${BASE_URL}/s.php`, { method: "POST", body: `a=1&tok=${token}`, headers: postH });
        const scanData = await scanResponse.json();
        const uniqueServers = new Map();
        if (scanData?.s) {
            scanData.s.forEach(ser => { if (ser[1]) uniqueServers.set(ser[1], ser); });
        }
        if (scanData?.langs_s?.LAT) {
            scanData.langs_s.LAT.forEach(ser => { if (ser[1]) uniqueServers.set(ser[1], ser); });
        }
        const servers = Array.from(uniqueServers.values()).filter(ser => {
            const name = ser[0];
            return !["Seek", "Lulu"].some(x => name.includes(x));
        }).slice(0, 5);
        const resultsRaw = await Promise.all(servers.map(async (ser) => {
            const [name, id] = ser;
            let finalUrl = await getDirectStream(id, token, cookie, playerUrl);
            if (finalUrl) {
                const finalHeaders = { "User-Agent": UA, "Referer": playerUrl, "Origin": BASE_URL };
                try {
                    const finalRes = await fetch(finalUrl, { method: "HEAD", headers: { "User-Agent": UA, "Referer": playerUrl }, redirect: "follow" });
                    if (finalRes.url && finalRes.url.includes("mediafire.com")) {
                        return { url: finalRes.url, serverName: `${name} - Directo`, langLabel: "Latino", quality: "1080p", verified: true, headers: { "User-Agent": UA, "Referer": "https://player.pelisserieshoy.com/" } };
                    }
                    if (finalRes.url) finalUrl = finalRes.url;
                } catch (e2) {}
                const resolvedResult = await resolveEmbed(finalUrl);
                return {
                    url: finalUrl,
                    serverName: (resolvedResult?.serverName ? `${name} - ${resolvedResult.serverName}` : name).replace(/ - Direct/g, ""),
                    langLabel: "Latino",
                    quality: "1080p",
                    verified: resolvedResult ? resolvedResult.verified : false,
                    headers: resolvedResult?.headers || finalHeaders
                };
            }
            return null;
        }));
        const resolved = resultsRaw.filter(r => r !== null);
        return await finalizeStreams(resolved, "SoloLatino", title || "");
    } catch (error) {
        console.error(`[SoloLatino] Error: ${error.message}`);
        return [];
    }
}