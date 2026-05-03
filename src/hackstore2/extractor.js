import { fetchJson, fetchHtml, getSessionUA, setSessionUA, getStealthHeaders } from '../utils/http.js';
import { validateStream } from '../utils/m3u8.js';
import { finalizeStreams, normalizeLanguage } from '../utils/engine.js';
import { getCorrectImdbId } from '../utils/id_mapper.js';
import { isMirror } from '../utils/mirrors.js';

const BASE_URL = "https://hackstore.mx";
const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

const COMMON_HEADERS = {
    "User-Agent": getSessionUA(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    "Sec-Ch-Ua": '"Not.A/Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?1",
    "Sec-Ch-Ua-Platform": '"Android"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1"
};

function localAtob(input) {
    if (!input) return "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let str = String(input).replace(/=+$/, "").replace(/[\s\n\r\t]/g, "");
    let output = "";
    if (str.length % 4 === 1) return "";
    for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
    }
    return output;
}

async function resolveVoe(url, signal = null) {
    try {
        const currentUA = getSessionUA();
        console.log(`[HackStore2-VOE] Resolving: ${url}`);
        const response = await fetch(url, { headers: { "User-Agent": currentUA }, signal });
        if (!response.ok) return null;
        const html = await response.text();
        if (html.includes("window.location.href") && html.length < 2000) {
            const rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
            if (rm) return resolveVoe(rm[1], signal);
        }
        const jsonMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1].trim());
                let encText = Array.isArray(parsed) ? parsed[0] : parsed;
                if (typeof encText !== "string") return null;
                let decoded = encText.replace(/[a-zA-Z]/g, (c) => {
                    const code = c.charCodeAt(0);
                    const limit = c <= "Z" ? 90 : 122;
                    const shifted = code + 13;
                    return String.fromCharCode(limit >= shifted ? shifted : shifted - 26);
                });
                const noise = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
                for (const n of noise) decoded = decoded.split(n).join("");
                const b64_1 = localAtob(decoded);
                if (!b64_1) throw new Error("LocalAtob failed stage 1");
                let shiftedStr = "";
                for (let j = 0; j < b64_1.length; j++) {
                    shiftedStr += String.fromCharCode(b64_1.charCodeAt(j) - 3);
                }
                const reversed = shiftedStr.split("").reverse().join("");
                const decrypted = localAtob(reversed);
                if (!decrypted) throw new Error("LocalAtob failed stage 2");
                const data = JSON.parse(decrypted);
                if (data && data.source) {
                    const reqHeaders = { "User-Agent": currentUA, "Referer": url };
                    const validation = await validateStream({ url: data.source, headers: reqHeaders }, signal);
                    return {
                        url: data.source,
                        quality: validation?.quality || "1080p",
                        verified: validation?.verified || true,
                        isReal: validation?.isReal || false,
                        serverName: "VOE",
                        headers: reqHeaders
                    };
                }
            } catch (ex) {
                console.error(`[HackStore2-VOE] Decryption failed: ${ex.message}`);
            }
        }
        const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
        if (m3u8Match) {
            const reqHeaders = { "Referer": url, "User-Agent": currentUA };
            return { url: m3u8Match[1], quality: "1080p", serverName: "VOE", headers: reqHeaders };
        }
        return null;
    } catch (error) {
        console.error(`[HackStore2-VOE] Error: ${error.message}`);
        return null;
    }
}

async function resolveStreamWish(url, signal = null) {
    try {
        const UA = getSessionUA();
        const rawId = url.split("/").pop().replace(/\.html$/, "");
        const urlObj = new URL(url);
        const mirrors = [
            `https://hanerix.com/e/${rawId}`,
            `https://embedwish.com/e/${rawId}`,
            `https://hglink.to/e/${rawId}`,
            url,
            `https://streamwish.to/e/${rawId}`,
            `https://awish.pro/e/${rawId}`,
            `https://strwish.com/e/${rawId}`
        ];
        console.log(`[HackStore2-StreamWish] Race-Resolving: ${rawId}`);
        const validResult = await new Promise((resolveRace) => {
            let resolved = false;
            let pending = mirrors.length;
            mirrors.forEach(async (mirror) => {
                try {
                    const mirrorObj = new URL(mirror);
                    const mirrorOrigin = mirrorObj.origin;
                    const resp = await fetch(mirror, { headers: { "Referer": mirror, "User-Agent": UA }, signal });
                    if (!resp.ok) throw new Error();
                    const html = await resp.text();
                    let m3u8Url = null;
                    const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/i);
                    if (fileMatch) m3u8Url = fileMatch[1];
                    if (m3u8Url && !resolved) {
                        resolved = true;
                        m3u8Url = m3u8Url.replace(/\\/g, "");
                        if (m3u8Url.startsWith("/")) m3u8Url = mirrorOrigin + m3u8Url;
                        resolveRace({ url: m3u8Url, mirror });
                    }
                } catch (e) {} finally {
                    pending--;
                    if (pending === 0 && !resolved) resolveRace(null);
                }
            });
            setTimeout(() => { if (!resolved) { resolved = true; resolveRace(null); } }, 3500);
        });
        if (!validResult) return null;
        const reqHeaders = { "Referer": validResult.mirror, "Origin": new URL(validResult.mirror).origin, "User-Agent": UA };
        return { url: validResult.url, quality: "Auto", serverName: "StreamWish", headers: reqHeaders };
    } catch (e) { return null; }
}

function unpackVidHide(script) {
    try {
        const match = script.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
        if (!match) return null;
        let [, p, a, c, k] = match;
        a = parseInt(a);
        c = parseInt(c);
        k = k.split("|");
        const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        const decode = (l, s) => {
            let res = "";
            while (l > 0) { res = chars[l % s] + res; l = Math.floor(l / s); }
            return res || "0";
        };
        return p.replace(/\b\w+\b/g, (l) => {
            const s = parseInt(l, 36);
            return s < k.length && k[s] ? k[s] : decode(s, a);
        });
    } catch (e) { return null; }
}

async function resolveVidHide(url, signal = null) {
    try {
        const currentUA = getSessionUA();
        console.log(`[HackStore2-VidHide] Resolving: ${url}`);
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const response = await fetch(url, {
            signal,
            headers: { "User-Agent": currentUA, "Referer": `https://${domain}/` }
        });
        if (!response.ok) return null;
        const html = await response.text();
        let finalUrl = null;
        let quality = "1080p";
        const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
        if (packedMatch) {
            const unpacked = unpackVidHide(packedMatch[0]);
            if (unpacked) {
                const hlsMatch = unpacked.match(/"hls[24]"\s*:\s*"([^"]+)"/);
                if (hlsMatch) finalUrl = hlsMatch[1];
                const labelMatch = unpacked.match(/\{label\s*:\s*"([^"]+)"/i);
                if (labelMatch) quality = labelMatch[1].toLowerCase().includes("p") ? labelMatch[1] : labelMatch[1] + "p";
            }
        }
        if (!finalUrl) {
            const rawMatch = html.match(/"hls[24]"\s*:\s*"([^"]+)"/) || html.match(/file\s*:\s*["']([^"']+)["']/i);
            if (rawMatch) finalUrl = rawMatch[1];
        }
        if (!finalUrl) return null;
        if (!finalUrl.startsWith("http")) finalUrl = new URL(url).origin + finalUrl;
        const reqHeaders = { ...getStealthHeaders(), "Referer": url.split("?")[0], "Origin": new URL(url).origin, "User-Agent": currentUA };
        return { url: finalUrl, quality, serverName: "VidHide", headers: reqHeaders };
    } catch (e) { return null; }
}

function unpack(p, a, c, k, e, d) {
    while (c--) if (k[c]) p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
    return p;
}

async function resolveFilemoon(url, signal = null) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const videoId = urlObj.pathname.split("/").filter((p) => !!p).pop();
        if (!videoId) return null;
        const UA_CHROME = getSessionUA();
        console.log(`[HackStore2-Filemoon] Resolving: ${videoId}`);
        try {
            const playbackUrl = `https://${hostname}/api/videos/${videoId}/embed/playback`;
            const response = await fetch(playbackUrl, {
                signal,
                headers: { "User-Agent": UA_CHROME, "Referer": url, "Origin": `https://${hostname}` }
            });
            if (response.ok) {
                const playbackData = await response.json();
                if (playbackData && playbackData.playback) {
                    const { decryptByse } = await import('../utils/aes_gcm.js');
                    const decrypted = decryptByse(playbackData.playback);
                    if (decrypted) {
                        const data = decrypted.includes("{") ? JSON.parse(decrypted) : null;
                        const directUrl = data?.sources?.[0]?.url || data?.url;
                        if (directUrl) {
                            return {
                                url: directUrl,
                                quality: data?.sources?.[0]?.label || "1080p",
                                verified: true,
                                serverName: "Filemoon",
                                headers: { "User-Agent": UA_CHROME, "Referer": `https://${hostname}/`, "Origin": `https://${hostname}` }
                            };
                        }
                    }
                }
            }
        } catch (e) { console.log(`[HackStore2-Filemoon] Shield Fallback: ${e.message}`); }
        return null;
    } catch (error) { return null; }
}

async function resolveEmbed(url, hint = "") {
    const s = url.toLowerCase();
    const serverHint = (hint || "").toLowerCase();
    if (serverHint.includes("voe") || s.includes("voe")) return await resolveVoe(url);
    if (serverHint.includes("wish") || s.includes("streamwish") || s.includes("filelions")) return await resolveStreamWish(url);
    if (serverHint.includes("vidhide") || s.includes("vidhide")) return await resolveVidHide(url);
    if (serverHint.includes("filemoon") || s.includes("filemoon")) return await resolveFilemoon(url);
    if (isMirror(s, "VOE")) return await resolveVoe(url);
    if (isMirror(s, "STREAMWISH")) return await resolveStreamWish(url);
    if (isMirror(s, "FILEMOON")) return await resolveFilemoon(url);
    if (isMirror(s, "VIDHIDE")) return await resolveVidHide(url);
    return { url, quality: "HD", verified: false };
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[HackStore2] Looking for content: ${tmdbId} (${mediaType})`);
    try {
        const currentUA = getSessionUA();
        setSessionUA(currentUA);
        const imdbInfo = await getCorrectImdbId(tmdbId, mediaType);
        if (!imdbInfo || !imdbInfo.imdbId) {
            console.log(`[HackStore2] No IMDB ID found for ${tmdbId}`);
            return [];
        }
        let urlSuffix = imdbInfo.imdbId;
        if (season !== null && episode !== null) {
            const epPadded = String(episode).padStart(2, "0");
            urlSuffix = `${imdbInfo.imdbId}-${season}x${epPadded}`;
        }
        const url = `${BASE_URL}/f/${urlSuffix}`;
        console.log(`[HackStore2] Searching: ${url}`);
        const response = await fetch(url, { headers: { "User-Agent": currentUA, "Referer": BASE_URL + "/" } });
        if (!response.ok) return [];
        const html = await response.text();
        const match = html.match(/let\s+dataLink\s*=\s*((\[[\s\S]*?\])|(\{[\s\S]*?\}))\s*;/);
        if (!match) return [];
        let rawData = JSON.parse(match[1].replace(/\\\//g, "/"));
        let data = Array.isArray(rawData) ? rawData : Object.values(rawData);
        const streams = [];
        const langMap = { "LAT": "Latino", "ESP": "Español", "SUB": "Subtitulado" };
        for (const item of data) {
            const vLang = (item.video_language || "").toUpperCase();
            if (vLang === "ESP") continue;
            const currentLangLabel = langMap[vLang] || "Latino";
            if (item.sortedEmbeds && Array.isArray(item.sortedEmbeds)) {
                for (const embed of item.sortedEmbeds) {
                    if (embed.embedUrl) {
                        const resolved = await resolveEmbed(embed.embedUrl, embed.type || "");
                        if (resolved) {
                            streams.push({
                                serverName: resolved.serverName || "Server",
                                audio: currentLangLabel,
                                quality: resolved.quality || "HD",
                                url: resolved.url,
                                headers: resolved.headers || { "User-Agent": currentUA }
                            });
                        }
                    }
                }
            }
        }
        return await finalizeStreams(streams, "HackStore2", title || "");
    } catch (error) {
        console.error(`[HackStore2] Error: ${error.message}`);
        return [];
    }
}