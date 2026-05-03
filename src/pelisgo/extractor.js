import { fetchHtml, fetchJson, getStealthHeaders } from '../utils/http.js';
import { finalizeStreams } from '../utils/engine.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { getCorrectImdbId, getTmdbTitle } from './tmdb.js';

const BASE = "https://pelisgo.online";
const WHITELIST = ["Magi", "Filemoon", "Pixeldrain"];

function getPelisGoHeaders(referer = BASE) {
    return {
        ...getStealthHeaders(),
        "Referer": referer,
        "Origin": BASE,
        "X-Requested-With": "XMLHttpRequest"
    };
}

function fetchWithTimeout(url, options = {}, timeout = 6000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...options, signal: controller.signal })
        .then(res => {
            clearTimeout(id);
            return res;
        })
        .catch(e => {
            clearTimeout(id);
            return { text: () => "", json: () => ({}), ok: false, status: 404 };
        });
}

function cleanTitle(str) {
    if (!str) return "";
    return str.replace(/["' ]+/g, "").replace(/\\u[\dA-F]{4}/gi, "").trim();
}

function normalizeLanguageStrict(str) {
    if (!str) return "Latino";
    const low = str.toLowerCase();
    if (low.includes("castellano") || low.includes("españa") || low.includes("esp")) {
        return null;
    }
    return "Latino";
}

function calculateSimilarity(title1, title2) {
    const normalize = (t) => {
        if (!t) return "";
        return t.toLowerCase()
            .replace(/[áàäâ]/g, "a")
            .replace(/[éèëê]/g, "e")
            .replace(/[íìïî]/g, "i")
            .replace(/[óòöô]/g, "o")
            .replace(/[úùüû]/g, "u")
            .replace(/ñ/g, "n")
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    };
    const n1 = normalize(title1);
    const n2 = normalize(title2);
    if (n1 === n2) return 1;
    if (n1.length > 6 && n2.length > 6 && (n2.indexOf(n1) !== -1 || n1.indexOf(n2) !== -1)) {
        return 0.95;
    }
    const w1 = n1.split(/\s+/);
    const w2 = n2.split(/\s+/);
    const words1Map = {};
    const words2Map = {};
    const allUniqueWords = {};
    for (let i = 0; i < w1.length; i++) {
        if (w1[i].length > 1) {
            words1Map[w1[i]] = true;
            allUniqueWords[w1[i]] = true;
        }
    }
    for (let j = 0; j < w2.length; j++) {
        if (w2[j].length > 1) {
            words2Map[w2[j]] = true;
            allUniqueWords[w2[j]] = true;
        }
    }
    let intersection = 0;
    let union = 0;
    for (const word in allUniqueWords) {
        union++;
        if (words1Map[word] && words2Map[word]) {
            intersection++;
        }
    }
    if (union === 0) return 0;
    const score = intersection / union;
    const yearMatch1 = title1.match(/\b(19|20)\d{2}\b/);
    const yearMatch2 = title2.match(/\b(19|20)\d{2}\b/);
    if (yearMatch1 && yearMatch2 && yearMatch1[0] !== yearMatch2[0]) {
        return score * 0.5;
    }
    return score;
}

async function getOnlineStreams(rawHtml) {
    const seenUrls = new Set();
    const resolutionPromises = [];
    const objects = rawHtml.match(new RegExp(`\\{[^{}]*?server[\\\\"' ]+:[^{}]*?\\}`, "gis")) || [];
    
    for (const objStr of objects) {
        resolutionPromises.push((async () => {
            try {
                const sM = objStr.match(/server[\\"' ]+:[\\"' ]+([^\\"' ,}]+)/i);
                const uM = objStr.match(/(url|download)[\\"' ]+:[\\"' ]+([^\\"' ,}]+)/i);
                const qM = objStr.match(/quality[\\"' ]+:[\\"' ]+([^\\"' ,}]+)/i);
                const lM = objStr.match(/language[\\"' ]+:[\\"' ]+([^\\"' ,}]+)/i);
                
                if (!sM || !uM) return null;
                
                const serverName = cleanTitle(sM[1]);
                let rawUrl = uM[2].replace(/\\/g, "").replace(/["' ]+/g, "");
                const quality = qM ? cleanTitle(qM[1]) : "1080p";
                const lang = lM ? cleanTitle(lM[1]) : "Latino";
                
                if (!WHITELIST.some(w => serverName.toLowerCase().includes(w.toLowerCase()))) {
                    return null;
                }
                
                const finalLang = normalizeLanguageStrict(lang);
                if (!finalLang) {
                    console.log(`[PelisGo] Omitiendo enlace Castellano de ${serverName}`);
                    return null;
                }
                
                let directUrl = rawUrl;
                if (rawUrl.includes("/download/")) {
                    const id = rawUrl.split("/").pop();
                    const downloadRes = await fetchWithTimeout(`${BASE}/api/download/${id}`, { headers: getPelisGoHeaders() });
                    const downloadData = await downloadRes.json().catch(() => ({}));
                    directUrl = downloadData.url || null;
                }
                
                if (!directUrl || seenUrls.has(directUrl)) return null;
                seenUrls.add(directUrl);
                
                const resEmbed = await resolveEmbed(directUrl);
                return {
                    name: "PelisGo",
                    langLabel: finalLang,
                    serverLabel: serverName,
                    url: resEmbed ? resEmbed.url : directUrl,
                    quality: (resEmbed ? resEmbed.quality : quality) || "1080p",
                    headers: (resEmbed ? resEmbed.headers : null) || getPelisGoHeaders(directUrl)
                };
            } catch (e) {
                return null;
            }
        })());
    }
    
    const results = await Promise.allSettled(resolutionPromises);
    return results
        .filter(r => r.status === "fulfilled" && r.value !== null)
        .map(r => r.value);
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
    try {
        const type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
        const meta = await getCorrectImdbId(tmdbId, mediaType);
        const mediaTitle = meta.title || title;
        
        if (!mediaTitle) {
            console.log(`[PelisGo] No se pudo obtener título para ${tmdbId}`);
            return [];
        }
        
        const slugPath = mediaTitle
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s\-]/gi, "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
        
        const targetPath = type === "movie" ? `/movies/${slugPath}` : `/series/${slugPath}`;
        const finalUrl = type === "movie" 
            ? `${BASE}${targetPath}` 
            : `${BASE}${targetPath}/temporada/${season || 1}/episodio/${episode || 1}`;
        
        console.log(`[PelisGo] Fetching: ${finalUrl}`);
        const resPage = await fetchWithTimeout(finalUrl);
        const html = await resPage.text();
        
        if (!html || html.includes("404") || !resPage.ok) {
            console.log(`[PelisGo] Slug fallido, reintentando con búsqueda...`);
            const searchRes = await fetchWithTimeout(`${BASE}/search?q=${encodeURIComponent(mediaTitle)}`);
            const searchHtml = await searchRes.text();
            
            const re = new RegExp(`href=["\\\\"]+([^"\\\\"]+(movies|series)\\/([\\w\\d\\-]+))["\\\\"]+`, "gi");
            let m;
            while ((m = re.exec(searchHtml)) !== null) {
                if (calculateSimilarity(mediaTitle, m[3].replace(/-/g, " ")) > 0.7) {
                    const resRetry = await fetchWithTimeout(`${BASE}${m[1].replace(/\\/g, "")}`);
                    const htmlRetry = await resRetry.text();
                    const streams2 = await getOnlineStreams(htmlRetry);
                    return await finalizeStreams(streams2, "PelisGo", mediaTitle);
                }
            }
            return [];
        }
        
        const streams = await getOnlineStreams(html);
        return await finalizeStreams(streams, "PelisGo", mediaTitle);
    } catch (e) {
        console.error(`[PelisGo] Error: ${e.message}`);
        return [];
    }
}