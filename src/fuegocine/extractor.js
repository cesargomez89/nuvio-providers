import { fetchHtml, fetchJson, getSessionUA } from '../utils/http.js';
import { getTmdbTitle, getTmdbInfo } from '../utils/tmdb.js';
import { resolveEmbed } from '../utils/resolvers.js';
import { finalizeStreams } from '../utils/engine.js';
import { levenshtein } from '../utils/title.js';
import { b64decode } from '../utils/helpers.js';

const BASE_URL = "https://www.fuegocine.com";
const SEARCH_BASE = `${BASE_URL}/feeds/posts/summary?alt=json&max-results=8&q=`;
const DEFAULT_HEADERS = {
  "User-Agent": getSessionUA(),
  "Referer": `${BASE_URL}/`
};

function normalize(t) {
  if (!t) return "";
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function decodeUrl(url) {
  if (!url) return "";
  const b64Match = url.match(/[?&]r=([A-Za-z0-9+/=]{10,})/);
  if (b64Match) {
    const decoded = b64decode(b64Match[1]);
    if (decoded) return decodeUrl(decoded);
  }
  const linkMatch = url.match(/[?&]link=([^&]+)/);
  if (linkMatch) {
    const decoded = decodeURIComponent(linkMatch[1]);
    if (decoded) return decodeUrl(decoded);
  }
  return url;
}

function extractSvLinks(html) {
  const links = [];
  const match = html.match(/const\s+_SV_LINKS\s*=\s*\[([\s\S]*?)\]\s*;/);
  if (!match) return links;
  
  const block = match[1];
  const entries = block.split(/\},?\s*\{/).map((e, i, arr) => {
    if (arr.length === 1) return e;
    if (i === 0) return e + "}";
    if (i === arr.length - 1) return "{" + e;
    return "{" + e + "}";
  });
  
  for (const entry of entries) {
    try {
      const lang = (entry.match(/lang\s*:\s*["']([^"']+)["']/) || [])[1] || "lat";
      const name = ((entry.match(/name\s*:\s*["']([^"']+)["']/) || [])[1] || "FC").replace(/&#9989;/g, "").replace(/&amp;/g, "&").replace(/✅/g, "").trim();
      const quality = (entry.match(/quality\s*:\s*["']([^"']+)["']/) || [])[1] || "HD";
      const rawUrl = (entry.match(/url\s*:\s*["']([^"']+)["']/) || [])[1] || "";
      if (!rawUrl) continue;
      const decoded = decodeUrl(rawUrl);
      links.push({
        lang: lang.toLowerCase(),
        serverName: name,
        quality,
        url: decoded
      });
    } catch (e) {}
  }
  return links;
}

export async function extractStreams(tmdbId, mediaType, season, episode, title) {
  try {
    let mediaTitle = title;
    let mediaYear = null;
    
    if (!mediaTitle && tmdbId) {
      mediaTitle = await getTmdbTitle(tmdbId, mediaType);
      const info = await getTmdbInfo(tmdbId, mediaType);
      mediaYear = info?.year || null;
    }
    if (!mediaTitle) return [];
    
    const isMovie = mediaType === "movie" || mediaType === "movies";
    const cleanTitle = mediaTitle.split(":")[0].trim();
    const searchTitle = isMovie ? cleanTitle : (mediaType === "tv" && season ? `${cleanTitle} ${season}x${String(episode).padStart(2, "0")}` : cleanTitle);
    const searchUrl = SEARCH_BASE + encodeURIComponent(searchTitle);
    console.log(`[FuegoCine Nitro v4] Buscando: ${searchTitle}${mediaYear ? ` (${mediaYear})` : ''}`);
    
    const searchJson = await fetchJson(searchUrl, { headers: { "User-Agent": DEFAULT_HEADERS["User-Agent"] } });
    let entries = (searchJson?.feed?.entry) || [];
    
    if (entries.length === 0 && cleanTitle.includes(" ")) {
      const retryTitle = cleanTitle.split(" ")[0];
      const retryUrl = SEARCH_BASE + encodeURIComponent(retryTitle);
      const retryJson = await fetchJson(retryUrl, { headers: { "User-Agent": DEFAULT_HEADERS["User-Agent"] } });
      entries = (retryJson?.feed?.entry) || [];
    }
    
    if (entries.length === 0 && isMovie && mediaYear) {
      const yearSearchUrl = SEARCH_BASE + encodeURIComponent(mediaYear.toString());
      const yearJson = await fetchJson(yearSearchUrl, { headers: { "User-Agent": DEFAULT_HEADERS["User-Agent"] } });
      entries = (yearJson?.feed?.entry) || [];
    }
    
    const normTarget = normalize(mediaTitle);
    const targetFirstWord = normTarget.split(" ")[0];
    
    const validEntries = entries.filter((e) => {
      const t = normalize(e.title?.$t || "");
      const titleWords = t.split(" ").filter(w => w.length > 2);
      const targetWords = normTarget.split(" ").filter(w => w.length > 2);
      
      const exactMatch = t.includes(normTarget);
      const firstWordMatch = targetFirstWord.length > 2 && (
        t.includes(targetFirstWord) || 
        targetFirstWord.includes(titleWords[0] || "") ||
        (titleWords[0] || "").includes(targetFirstWord.split(" ")[0])
      );
      const yearMatch = mediaYear && t.includes(mediaYear.toString());
      
      if (isMovie) {
        if (exactMatch) return true;
        if (yearMatch && targetWords.length > 0) {
          const wordMatch = targetWords.some(tw => 
            titleWords.some(w => 
              w.length > 3 && (w.includes(tw) || tw.includes(w) || levenshtein(w, tw) <= 2)
            )
          );
          if (wordMatch) return true;
        }
        if (yearMatch && firstWordMatch) return true;
        if (firstWordMatch && t.length < targetFirstWord.length + 15) return true;
        return false;
      }
      return exactMatch || firstWordMatch;
    }).slice(0, 5);
    
    if (validEntries.length === 0) {
      const firstWord = normTarget.split(" ")[0];
      const fallbackEntries = entries.filter(e => {
        const t = normalize(e.title?.$t || "");
        const fFirstWord = t.split(" ")[0];
        
        if (isMovie && mediaYear) {
          const yearInTitle = t.includes(mediaYear.toString());
          const wordMatch = firstWord.length > 2 && (firstWord.includes(fFirstWord) || fFirstWord.includes(firstWord));
          return yearInTitle && wordMatch;
        }
        return t.includes(firstWord);
      }).slice(0, 3);
      validEntries.push(...fallbackEntries);
    }
    
    const allRawLinks = [];
    await Promise.all(validEntries.map(async (entry) => {
      const url = entry.link?.find((l) => l.rel === "alternate")?.href;
      if (!url) return;
      const html = await fetchHtml(url, { headers: DEFAULT_HEADERS });
      const links = extractSvLinks(html);
      allRawLinks.push(...links);
    }));
    
    if (allRawLinks.length === 0) return [];
    
    const streams = [];
    const langOrder = ["lat", "mex", "col", "esp", "sub"];
    const sortedLinks = allRawLinks.sort((a, b) => {
      const aIdx = langOrder.indexOf(String(a.lang));
      const bIdx = langOrder.indexOf(String(b.lang));
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
    
    const resolutionResults = await Promise.allSettled(
      sortedLinks.map(async (link) => {
        const result = await resolveEmbed(link.url);
        if (result && result.url) {
          const finalQuality = (link.quality?.includes("1080")) || (link.quality?.includes("FHD")) ? "1080p" : result.quality || link.quality || "720p";
          return {
            langLabel: "Latino",
            serverLabel: result.serverName || link.serverName || "Server",
            url: result.url,
            quality: finalQuality,
            headers: result.headers || DEFAULT_HEADERS,
            verified: true
          };
        }
        return null;
      })
    );
    
    resolutionResults.forEach((res) => {
      if (res.status === "fulfilled" && res.value) streams.push(res.value);
    });
    
    return await finalizeStreams(streams, "FuegoCine", mediaTitle);
  } catch (e) {
    console.error(`[FuegoCine Nitro v4] Error: ${e.message}`);
    return [];
  }
}