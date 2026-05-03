import { fetchHtml } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import CryptoJS from 'crypto-js';

const MAIN_URL = "https://cinemacity.cc";
const TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";

function extractQuality(url) {
    const low = (url || "").toLowerCase();
    if (low.includes("2160p") || low.includes("4k")) return "4K";
    if (low.includes("1080p")) return "1080p";
    if (low.includes("720p")) return "720p";
    if (low.includes("480p")) return "480p";
    if (low.includes("360p")) return "360p";
    return "HD";
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    if (!tmdbId) return [];
    console.log(`[CineCity] Iniciando búsqueda: ${tmdbId} - ${mediaType}`);

    const currentUA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const HEADERS = {
        "User-Agent": currentUA,
        "Cookie": "dle_user_id=32729; dle_password=894171c6a8dab18ee594d5c652009a35;",
        "Referer": "https://cinemacity.cc/"
    };

    try {
        const tmdbUrl = `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY}`;
        const tmdbRes = await fetch(tmdbUrl, { skipSizeCheck: true }).catch(() => null);
        if (!tmdbRes || !tmdbRes.ok) return [];
        const mediaInfo = await tmdbRes.json();
        const searchTitle = mediaInfo.title || mediaInfo.name || title;
        if (!searchTitle) return [];

        const searchUrl = `${MAIN_URL}/?do=search&subaction=search&search_start=0&full_search=0&story=${encodeURIComponent(searchTitle)}`;
        const searchHtml = await fetchHtml(searchUrl, { headers: HEADERS }).catch(() => null);
        if (!searchHtml) return [];

        const cheerio = require("cheerio");
        const $search = cheerio.load(searchHtml);
        let mediaUrl = null;

        $search("div.dar-short_item").each((i, el) => {
            if (mediaUrl) return;
            const anchor = $search(el).find("a").filter((idx, a) => ($search(a).attr("href") || "").includes(".html")).first();
            if (!anchor.length) return;
            const foundTitle = anchor.text().split("(")[0].trim().toLowerCase();
            const targetTitle = searchTitle.toLowerCase();
            if (foundTitle === targetTitle || foundTitle.includes(targetTitle) || targetTitle.includes(foundTitle)) {
                mediaUrl = anchor.attr("href");
            }
        });

        if (!mediaUrl) {
            const homeHtml = await fetchHtml(MAIN_URL, { headers: HEADERS }).catch(() => null);
            if (homeHtml) {
                const $home = cheerio.load(homeHtml);
                $home("div.dar-short_item").each((i, el) => {
                    if (mediaUrl) return;
                    const anchor = $home(el).find("a").filter((idx, a) => ($home(a).attr("href") || "").includes(".html")).first();
                    if (!anchor.length) return;
                    const foundTitle = anchor.text().split("(")[0].trim().toLowerCase();
                    if (foundTitle === searchTitle.toLowerCase())
                        mediaUrl = anchor.attr("href");
                });
            }
        }

        if (!mediaUrl) {
            console.log(`[CineCity] No se encontró la URL para: ${searchTitle}`);
            return [];
        }

        console.log(`[CineCity] Procesando enlace: ${mediaUrl}`);
        const pageHtml = await fetchHtml(mediaUrl, { headers: HEADERS }).catch(() => null);
        if (!pageHtml) return [];

        const $page = cheerio.load(pageHtml);
        let fileData = null;

        $page("script").each((i, el) => {
            if (fileData) return;
            const htmlStr = $page(el).html();
            if (htmlStr && htmlStr.includes("atob")) {
                const regex = /atob\s*\(\s*(['"])(.*?)\1\s*\)/g;
                let match;
                while ((match = regex.exec(htmlStr)) !== null) {
                    try {
                        const decoded = CryptoJS.enc.Base64.parse(match[2]).toString(CryptoJS.enc.Utf8);
                        const fileMatch = decoded.match(new RegExp(`file\\s*:\\s*(['"])(.*?)\\1`, "s")) || decoded.match(new RegExp("file\\s*:\\s*(\\[.*?\\])", "s"));
                        if (fileMatch) {
                            let rawFile = fileMatch[2] || fileMatch[1];
                            if (rawFile && rawFile.length > 5) {
                                if (rawFile.startsWith("[") || rawFile.startsWith("{")) {
                                    try {
                                        fileData = JSON.parse(rawFile.replace(/\\(.)/g, "$1"));
                                    } catch (e) {
                                        try {
                                            fileData = JSON.parse(rawFile);
                                        } catch (e2) {
                                            fileData = rawFile;
                                        }
                                    }
                                } else {
                                    fileData = rawFile;
                                }
                                if (fileData) return;
                            }
                        }
                    } catch (e) {}
                }
            }
        });

        if (!fileData) {
            console.log(`[CineCity] No se encontraron datos decodificados.`);
            return [];
        }

        const streams = [];
        const addStream = (url, streamTitle, qualityLabel) => {
            if (!url || !url.startsWith("http") || url.length < 15) return;
            const lowerLang = (qualityLabel || "").toLowerCase();
            if (lowerLang.includes("sub") || lowerLang.includes("castellano") || lowerLang.includes("esp") || lowerLang.includes("vose")) {
                console.log(`[CineCity] Descartado por idioma no deseado: ${qualityLabel}`);
                return;
            }
            let finalUrl = url;
            if (!finalUrl.includes(".m3u8") && !finalUrl.includes(".mp4")) {
                finalUrl += "#.m3u8";
            }
            streams.push({
                langLabel: "Latino",
                serverLabel: "CinemaCity",
                url: finalUrl,
                quality: extractQuality(url),
                headers: { ...HEADERS, "User-Agent": currentUA },
                verified: true
            });
        };

        const processStr = (str, streamTitle) => {
            if (str.includes(".urlset/master.m3u8")) {
                addStream(str, streamTitle, "Latino");
            } else {
                const urls = str.includes("[") ? str.split(",") : [str];
                urls.forEach(u => {
                    const m = u.match(/\[(.*?)\](.*)/);
                    if (m) {
                        addStream(m[2], streamTitle, m[1]);
                    } else {
                        addStream(u, streamTitle, "Latino");
                    }
                });
            }
        };

        if (mediaType === "movie" || mediaType === "movies") {
            if (Array.isArray(fileData)) {
                const obj = fileData.find(f => !f.folder && f.file) || fileData[0];
                if (obj && obj.file)
                    processStr(obj.file, searchTitle);
            } else if (typeof fileData === "string") {
                processStr(fileData, searchTitle);
            }
        } else {
            if (Array.isArray(fileData)) {
                const sLabel = `Season ${season}`;
                const sObj = fileData.find(s => (s.title || "").includes(sLabel) || (s.title || "").includes(`S${season}`));
                if (sObj && sObj.folder) {
                    const eLabel = `Episode ${episode}`;
                    const eObj = sObj.folder.find(e => (e.title || "").includes(eLabel) || (e.title || "").includes(`E${episode}`));
                    if (eObj && eObj.file)
                        processStr(eObj.file, `${searchTitle} S${season}E${episode}`);
                }
            }
        }

        console.log(`[CineCity] Total enlaces extraídos: ${streams.length}`);
        return await finalizeStreams(streams, "CineCity", searchTitle);
    } catch (error) {
        console.error(`[CineCity] Error crítico: ${error.message}`);
        return [];
    }
}