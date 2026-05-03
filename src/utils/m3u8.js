const { getSessionUA } = require('./http.js');

function getQualityFromHeight(height) {
  if (!height)
    return "1080p";
  const h = parseInt(height);
  if (h >= 2160)
    return "4K";
  if (h >= 1440)
    return "1440p";
  if (h >= 1080)
    return "1080p";
  if (h >= 720)
    return "720p";
  if (h >= 480)
    return "480p";
  if (h >= 360)
    return "360p";
  return "1080p";
}

function parseBestQuality(content, url = "") {
  let bestHeight = 0;
  let bestBandwidth = 0;
  if (content) {
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.includes("RESOLUTION=")) {
        const match = line.match(/RESOLUTION=\d+x(\d+)/i);
        if (match) {
          const height = parseInt(match[1]);
          if (height > bestHeight)
            bestHeight = height;
        }
      }
      if (line.includes("BANDWIDTH=")) {
        const match = line.match(/BANDWIDTH=(\d+)/i);
        if (match) {
          const bandwidth = parseInt(match[1]);
          if (bandwidth > bestBandwidth)
            bestBandwidth = bandwidth;
        }
      }
    }
  }
  let quality = "1080p";
  let isReal = false;
  if (bestHeight > 0) {
    quality = getQualityFromHeight(bestHeight);
  } else {
    const qMatch = url.match(/([_-]|\/)(\d{3,4})([pP]|(\.m3u8))?/);
    if (qMatch) {
      const h = parseInt(qMatch[2]);
      if (h >= 360 && h <= 4320)
        quality = getQualityFromHeight(h);
    }
  }
  if (bestHeight > 0)
    isReal = true;
  if (bestBandwidth >= 2e6)
    isReal = true;
  return { quality, isReal };
}

const VALIDATION_CACHE = new Map();

async function validateStream(stream, signal = null) {
  if (!stream || !stream.url)
    return stream;
  const { url, headers } = stream;
  const isMp4 = url.toLowerCase().includes(".mp4");

  if (VALIDATION_CACHE.has(url))
    return { ...stream, ...VALIDATION_CACHE.get(url) };

  try {
    const fetchOptions = {
      method: isMp4 ? "HEAD" : "GET",
      headers: {
        "User-Agent": getSessionUA(),
        ...(headers || {})
      }
    };
    if (signal)
      fetchOptions.signal = signal;

    const response = await fetch(url, fetchOptions);
    if (!response.ok)
      return { ...stream, verified: false };

    if (isMp4) {
      const resultData = { verified: true, quality: stream.quality || "1080p", isReal: true };
      VALIDATION_CACHE.set(url, resultData);
      return { ...stream, ...resultData };
    }

    const text = await response.text();
    const info = parseBestQuality(text, url);
    const resultData = {
      verified: true,
      quality: info.quality,
      isReal: info.isReal
    };
    VALIDATION_CACHE.set(url, resultData);
    return { ...stream, ...resultData };
  } catch (error) {
    const info = parseBestQuality("", url);
    const resultData = { quality: info.quality, verified: true, isReal: false };
    VALIDATION_CACHE.set(url, resultData);
    return { ...stream, ...resultData };
  }
}

module.exports = { validateStream, getQualityFromHeight };