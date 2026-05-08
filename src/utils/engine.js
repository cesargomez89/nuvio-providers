const { validateStream } = require('./m3u8.js');
const { sortStreamsByQuality } = require('./sorting.js');
const { isMirror } = require('./mirrors.js');

function normalizeLanguage(lang) {
  const l = (lang || "").toLowerCase();
  if (l === "latino" || l === "español" || l === "lat" || l === "auto") {
    return "Latino";
  }
  if (l.includes("lat") || l.includes("mex") || l.includes("col") || l.includes("arg") || l.includes("chi") || l.includes("per") || l.includes("dub") || l.includes("dual")) {
    return "Latino";
  }
  if (l.includes("esp") || l.includes("cas") || l.includes("spa") || l.includes("cast") || l === "esp") {
    return "Castellano";
  }
  if (l.includes("sub") || l.includes("vose") || l === "sub") {
    return "Subtitulado";
  }
  if (l.includes("eng") || l.includes("en-us") || l === "en") {
    return "Inglés";
  }
  return lang || "Latino";
}

function normalizeServer(server, url = "", resolvedServerName = null) {
  if (resolvedServerName)
    return resolvedServerName;
  const u = (url || "").toLowerCase();
  const s = (server || "").toLowerCase();
  if (u.includes("goodstream") || s.includes("goodstream"))
    return "GoodStream";
  if (isMirror(u, "FASTREAM") || isMirror(s, "FASTREAM"))
    return "Fastream";
  if (isMirror(u, "DROPCDN") || isMirror(s, "DROPCDN"))
    return "DropCDN";
  if (u.includes("vimeos") || u.includes("vms.sh") || s.includes("vimeos"))
    return "Vimeos";
  if (isMirror(u, "VIDHIDE") || isMirror(s, "VIDHIDE"))
    return "VidHide";
  if (isMirror(u, "STREAMWISH") || isMirror(s, "STREAMWISH"))
    return "StreamWish";
  if (isMirror(u, "VOE") || isMirror(s, "VOE"))
    return "VOE";
  if (isMirror(u, "FILEMOON") || isMirror(s, "FILEMOON"))
    return "Filemoon";
  if (url && url.includes("supervideo"))
    return "Supervideo";
  if (isMirror(u, "DOODSTREAM") || isMirror(s, "DOODSTREAM"))
    return "DoodStream";
  if (url) {
    try {
      const domainParts = new URL(url).hostname.replace("www.", "").split(".");
      const mainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
      return mainName.charAt(0).toUpperCase() + mainName.slice(1);
    } catch {
    }
  }
  return server || "Servidor";
}

async function finalizeStreams(streams, providerName) {
  if (!Array.isArray(streams) || streams.length === 0)
    return [];
  console.log(`[Engine] PROCESANDO STREAMS - Bitrate Global v7.6.0`);
  const sorted = sortStreamsByQuality(streams);
  const CONCURRENCY_LIMIT = 5;
  const MAX_VALIDATIONS = 5;
  const validatedStreams = [];
  for (let i = 0; i < sorted.length; i += CONCURRENCY_LIMIT) {
    if (i >= MAX_VALIDATIONS) {
      validatedStreams.push(...sorted.slice(i));
      break;
    }
    const batch = sorted.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(batch.map(async (s) => {
      try {
        if (s.isReal === true)
          return s;
        if (s.url && (s.url.includes(".m3u8") || s.url.includes(".mp4"))) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2500);
          try {
            const validated = await validateStream(s, controller.signal);
            clearTimeout(timeoutId);
            return validated;
          } catch {
            clearTimeout(timeoutId);
            return { ...s, verified: false, isReal: false };
          }
        }
      } catch {
      }
      return s;
    }));
    validatedStreams.push(...batchResults);
  }

  const processed = [];
  const seenTitles = new Set();
  for (const s of validatedStreams) {
    if (!s)
      continue;
    if (s.verified === false)
      continue;
    const rawLang = normalizeLanguage(s.lang || s.Audio || s.langLabel || s.language || s.audio || "Latino");
    const l = rawLang.toLowerCase();
    const isLatino = l.includes("latino") || l.includes("castellano");
    if (!isLatino && providerName !== "FuegoCine")
      continue;
    const server = normalizeServer(s.serverLabel || s.serverName || s.servername, s.url, s.serverName);
    const quality = s.quality || "HD";
    const isReal = s.isReal === true;
    const isVerified = s.verified === true;
    const checkMark = isReal ? " ✅" : "";
    const streamName = `${providerName} - ${quality}${checkMark}`;
    const streamTitle = `${rawLang} - ${server}`;
    if (seenTitles.has(streamName + streamTitle + s.url))
      continue;
    seenTitles.add(streamName + streamTitle + s.url);
    processed.push({
      name: streamName,
      title: streamTitle,
      url: s.url,
      quality,
      verified: isVerified,
      isReal,
      provider: server,
      language: rawLang,
      headers: s.headers || {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; TV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
  }
  return processed;
}

module.exports = { finalizeStreams, normalizeLanguage };