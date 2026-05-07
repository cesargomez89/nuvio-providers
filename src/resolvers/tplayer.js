const { getStealthHeaders } = require('../utils/http.js');

async function resolve(embedUrl, signal = null) {
  try {
    console.log(`[TPlayer] Resolviendo: ${embedUrl}`);
    const idMatch = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) return null;
    const fileId = idMatch[1];
    const baseUrl = new URL(embedUrl).origin;
    const apiUrl = `${baseUrl}/api/resolve/${fileId}`;
    const baseHeaders = {
      ...getStealthHeaders(),
      "Referer": embedUrl,
      "Origin": baseUrl,
      "X-Requested-With": "XMLHttpRequest"
    };
    const embedResp = await fetch(embedUrl, { signal, headers: baseHeaders });
    let cookies = "";
    try {
      const raw = embedResp.headers.get("set-cookie");
      if (raw) cookies = raw.split(",").map(c => c.split(";")[0].trim()).join("; ");
    } catch (e) {}
    if (cookies) baseHeaders["Cookie"] = cookies;
    const apiResp = await fetch(apiUrl, { signal, headers: baseHeaders });
    if (!apiResp.ok) return null;
    const data = await apiResp.json();
    if (!data || !data.success || !data.streamUrl) return null;
    const streamUrl = data.streamUrl.startsWith("http")
      ? data.streamUrl
      : `${baseUrl}${data.streamUrl}`;
    return {
      url: streamUrl,
      isDirect: true,
      verified: true,
      serverName: "Tplayer",
      headers: {
        "User-Agent": baseHeaders["User-Agent"],
        "Referer": embedUrl,
        "Origin": baseUrl,
        "Cookie": cookies
      }
    };
  } catch (e) {
    console.error(`[TPlayer] Error: ${e.message}`);
    return null;
  }
}

module.exports = { resolve };
