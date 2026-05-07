const { getStealthHeaders } = require('../utils/http.js');

async function resolve(embedUrl, signal = null) {
  if (!embedUrl) return null;
  try {
    const cleanUrl = embedUrl.split("|")[0].replace(/\/$/, "");
    const domain = new URL(cleanUrl).hostname;
    const downloadUrl = `${cleanUrl}/download`;
    console.log(`[Buzzheavier] Resolviendo: ${cleanUrl}`);
    const headers = {
      ...getStealthHeaders(),
      "Referer": cleanUrl,
      "hx-current-url": cleanUrl,
      "hx-request": "true",
      "Accept": "*/*"
    };
    try {
      const headResponse = await fetch(downloadUrl, {
        method: "HEAD",
        headers,
        redirect: "manual",
        signal
      });
      const hxRedirect = headResponse.headers.get("hx-redirect");
      if (hxRedirect) {
        let finalUrl = hxRedirect;
        if (hxRedirect.startsWith("/dl/")) {
          finalUrl = `https://${domain}${hxRedirect}`;
        }
        console.log("[Buzzheavier] Link REAL via hx-redirect.");
        return {
          url: finalUrl + "#.mp4",
          isDirect: true,
          verified: true,
          serverName: "Buzzheavier",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
            "Referer": cleanUrl,
            "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "cross-site",
            "upgrade-insecure-requests": "1",
            "priority": "u=0, i"
          }
        };
      }
    } catch (err) {
      console.log(`[Buzzheavier] HEAD fallback: ${err.message}`);
    }
    const id = cleanUrl.split("/").pop();
    const predictableUrl = `https://buzzheavier.com/v/${id}/video.mp4`;
    return {
      url: predictableUrl + "#.mp4",
      isDirect: true,
      verified: true,
      serverName: "Buzzheavier",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        "Referer": cleanUrl,
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site"
      }
    };
  } catch (err) {
    console.error(`[Buzzheavier] Error: ${err.message}`);
    return null;
  }
}

module.exports = { resolve };
