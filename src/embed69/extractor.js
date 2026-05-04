import { fetchJson, fetchHtml, getSessionUA, setSessionUA, getStealthHeaders } from '../utils/http.js';
import { validateStream } from '../utils/m3u8.js';
import { finalizeStreams, normalizeLanguage } from '../utils/engine.js';
import { getCorrectImdbId } from '../utils/id_mapper.js';
import { isMirror } from '../utils/mirrors.js';

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

function getServerHint(url) {
    if (!url) return '';
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        if (hostname.includes('voe')) return 'voe';
        if (hostname.includes('streamwish') || hostname.includes('hglink') || hostname.includes('wishembed') || hostname.includes('filelions')) return 'wish';
        if (hostname.includes('filemoon') || hostname.includes('moon') || hostname.includes('bysedikamoum')) return 'filemoon';
        if (hostname.includes('vidhide') || hostname.includes('dintezuvio')) return 'vidhide';
        return '';
    } catch { return ''; }
}

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
                if (!b64_1) throw new Error("LocalAtob failed");
                let shiftedStr = "";
                for (let j = 0; j < b64_1.length; j++) {
                    shiftedStr += String.fromCharCode(b64_1.charCodeAt(j) - 3);
                }
                const reversed = shiftedStr.split("").reverse().join("");
                const decrypted = localAtob(reversed);
                if (!decrypted) throw new Error("LocalAtob failed 2");
                const data = JSON.parse(decrypted);
                if (data && data.source) {
                    const reqHeaders = { "User-Agent": currentUA, "Referer": url };
                    return { url: data.source, quality: "1080p", verified: true, serverName: "VOE", headers: reqHeaders };
                }
            } catch (ex) {}
        }
        const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
        if (m3u8Match) {
            return { url: m3u8Match[1], quality: "1080p", serverName: "VOE", headers: { "User-Agent": currentUA, "Referer": url } };
        }
        return null;
    } catch (error) { return null; }
}

async function resolveStreamWish(url, signal = null) {
    try {
        const UA = getSessionUA();
        const rawId = url.split("/").pop().replace(/\.html$/, "");
        const mirrors = [
            `https://hanerix.com/e/${rawId}`,
            `https://embedwish.com/e/${rawId}`,
            `https://hglink.to/e/${rawId}`,
            url,
            `https://streamwish.to/e/${rawId}`,
            `https://awish.pro/e/${rawId}`
        ];
        const validResult = await new Promise((resolveRace) => {
            let resolved = false;
            let pending = mirrors.length;
            mirrors.forEach(async (mirror) => {
                try {
                    const resp = await fetch(mirror, { headers: { "Referer": mirror, "User-Agent": UA }, signal });
                    if (!resp.ok) throw new Error();
                    const html = await resp.text();
                    const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/i);
                    if (fileMatch && !resolved) {
                        resolved = true;
                        resolveRace({ url: fileMatch[1], mirror });
                    }
                } catch (e) {} finally {
                    pending--;
                    if (pending === 0 && !resolved) resolveRace(null);
                }
            });
            setTimeout(() => { if (!resolved) { resolved = true; resolveRace(null); } }, 3500);
        });
        if (!validResult) return null;
        return { url: validResult.url, quality: "Auto", serverName: "StreamWish", headers: { "Referer": validResult.mirror, "User-Agent": UA } };
    } catch (e) { return null; }
}

function unpackVidHide(script) {
    try {
        const match = script.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
        if (!match) return null;
        let [, p, a, c, k] = match;
        a = parseInt(a); c = parseInt(c); k = k.split("|");
        const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        const decode = (l, s) => { let res = ""; while (l > 0) { res = chars[l % s] + res; l = Math.floor(l / s); } return res || "0"; };
        return p.replace(/\b\w+\b/g, (l) => { const s = parseInt(l, 36); return s < k.length && k[s] ? k[s] : decode(s, a); });
    } catch (e) { return null; }
}

async function resolveVidHide(url, signal = null) {
    try {
        const currentUA = getSessionUA();
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const response = await fetch(url, { signal, headers: { "User-Agent": currentUA, "Referer": `https://${domain}/` } });
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
        const reqHeaders = { ...getStealthHeaders(), "Referer": url.split("?")[0], "User-Agent": currentUA };
        return { url: finalUrl, quality, serverName: "VidHide", headers: reqHeaders };
    } catch (e) { return null; }
}

async function resolveFilemoon(url, signal = null) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const videoId = urlObj.pathname.split("/").filter((p) => !!p).pop();
        if (!videoId) return null;
        const UA_CHROME = getSessionUA();
        try {
            const playbackUrl = `https://${hostname}/api/videos/${videoId}/embed/playback`;
            const response = await fetch(playbackUrl, { signal, headers: { "User-Agent": UA_CHROME, "Referer": url, "Origin": `https://${hostname}` } });
            if (response.ok) {
                const playbackData = await response.json();
                if (playbackData && playbackData.playback) {
                    const { decryptByse } = await import('../utils/aes_gcm.js');
                    const decrypted = decryptByse(playbackData.playback);
                    if (decrypted) {
                        const data = decrypted.includes("{") ? JSON.parse(decrypted) : null;
                        const directUrl = data?.sources?.[0]?.url || data?.url;
                        if (directUrl) {
                            return { url: directUrl, quality: data?.sources?.[0]?.label || "1080p", verified: true, serverName: "Filemoon", headers: { "User-Agent": UA_CHROME, "Referer": `https://${hostname}/` } };
                        }
                    }
                }
            }
        } catch (e) {}
        return null;
    } catch (error) { return null; }
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

async function resolveEmbedLocal(url, hint = "") {
    if (!url) return null;
    const s = url.toLowerCase();
    const serverHint = (hint || "").toLowerCase();
    console.log(`[Embed69] Resolving: ${url} (Hint: ${hint})`);
    try {
        if (serverHint.includes("vidhide") || serverHint.includes("minochinos")) {
            const res = await resolveVidHide(url);
            if (res) return applyPipingLocal(res);
        }
        if (serverHint.includes("voe") || serverHint.includes("marissa")) {
            const res = await resolveVoe(url);
            if (res) return applyPipingLocal(res);
        }
        if (serverHint.includes("filemoon") || serverHint.includes("moon")) {
            const res = await resolveFilemoon(url);
            if (res) return applyPipingLocal(res);
        }
        if (serverHint.includes("wish") || serverHint.includes("lions") || serverHint.includes("hlswish")) {
            const res = await resolveStreamWish(url);
            if (res) return applyPipingLocal(res);
        }
        if (isMirror(s, "VOE")) return applyPipingLocal(await resolveVoe(url));
        if (isMirror(s, "STREAMWISH") || s.includes("filelions")) return applyPipingLocal(await resolveStreamWish(url));
        if (isMirror(s, "FILEMOON")) return applyPipingLocal(await resolveFilemoon(url));
        if (isMirror(s, "VIDHIDE")) return applyPipingLocal(await resolveVidHide(url));
        if (s.includes("/v/")) return applyPipingLocal(await resolveVoe(url));
        if (s.includes("/e/")) return applyPipingLocal(await resolveVidHide(url));
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
        const tmdbIdOnly = String(tmdbId).split(":")[0];
        const imdbInfo = await getCorrectImdbId(tmdbIdOnly, mediaType);
        if (!imdbInfo || !imdbInfo.imdbId) {
            console.log(`[Embed69] No IMDB ID found`);
            return [];
        }
        let displayTitle = title || "Contenido";
        if (imdbInfo && imdbInfo.title) displayTitle = imdbInfo.title;
        let urlSuffix = imdbInfo.imdbId;
        if (s !== null && e !== null) {
            const epPadded = String(e).padStart(2, "0");
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
                const serverHint = getServerHint(payload.link);
                embeds.push({ url: payload.link, hint: serverHint, servername: embed.servername });
            }

            if (embeds.length === 0) continue;

            console.log(`[Embed69] Resolving ${embeds.length} embeds (${lang})...`);
            const resolvedResults = await Promise.all(
                embeds.map(emb => resolveEmbedLocal(emb.url, emb.hint))
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