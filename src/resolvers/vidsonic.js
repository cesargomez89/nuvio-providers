async function resolve(embedUrl, signal = null) {
  try {
    const id = embedUrl.split("/").pop().replace(".html", "");
    const targetUrl = `https://vidsonic.net/e/${id}`;
    const response = await fetch(targetUrl, {
      signal,
      headers: {
        "Referer": "https://www.fuegocine.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) return null;
    const html = await response.text();
    const vMatch = html.match(/const\s+_0x1\s*=\s*['"]([^'"]+)['"]/);
    if (vMatch) {
      const hexPipe = vMatch[1];
      const clean = hexPipe.split("|").join("");
      let decoded = "";
      for (let i = 0; i < clean.length; i += 2) {
        decoded += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
      }
      const finalUrl = decoded.split("").reverse().join("");
      if (finalUrl.includes("http")) {
        return {
          url: finalUrl,
          quality: "HD",
          serverName: "Vidsonic",
          verified: true,
          headers: { "Referer": targetUrl }
        };
      }
    }
    const hexMatch = html.match(/\["([a-f0-9]{50,})"\]/);
    if (hexMatch) {
      const hex = hexMatch[1].split("").reverse().join("");
      let decoded = "";
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      if (decoded.includes("http")) {
        return {
          url: decoded,
          quality: "HD",
          serverName: "Vidsonic",
          verified: true,
          headers: { "Referer": targetUrl }
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = { resolve };
