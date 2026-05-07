async function resolve(url, signal = null) {
  try {
    let embedUrl = url.toString()
      .replace("vidsrc.to", "vidsrc.xyz")
      .replace("vidsrc.pm", "vidsrc.xyz")
      .replace("moviesapi.club/movie", "cdn.moviesapi.to/embed/movie")
      .replace("moviesapi.to/movie", "cdn.moviesapi.to/embed/movie");
    console.log(`[VidSrc] Resolviendo: ${embedUrl}`);
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    const headers = { "User-Agent": UA, "Referer": "https://vidsrc.xyz/" };
    const res1 = await fetch(embedUrl, { headers, signal });
    if (!res1.ok) return null;
    const html1 = await res1.text();
    const iframeMatch = html1.match(/src=['"]([^"]+)['"] f/);
    if (!iframeMatch) return null;
    let nextUrl = iframeMatch[1];
    if (nextUrl.startsWith("//")) nextUrl = "https:" + nextUrl;
    const res2 = await fetch(nextUrl, {
      headers: { ...headers, "Referer": embedUrl },
      signal
    });
    if (!res2.ok) return null;
    const html2 = await res2.text();
    const encryptedMatch = html2.match(/id="([^"]+)" style="display:none;">([^<]+)/);
    if (!encryptedMatch) return null;
    const decId = encryptedMatch[1];
    const cipherText = encryptedMatch[2];
    const decrypted = crsdiv(cipherText, decId);
    if (!decrypted) return null;
    const finalUrl = decrypted.split(" ")[0].replace("{v1}", "thrumbleandjaxon.com");
    return {
      url: finalUrl,
      quality: "HD",
      verified: true,
      serverName: "VidSrc",
      headers: {
        "User-Agent": UA,
        "Referer": nextUrl,
        "Origin": new URL(nextUrl).origin
      }
    };
  } catch (e) {
    console.error(`[VidSrc] Error: ${e.message}`);
    return null;
  }
}

function crsdiv(a, decId) {
  try {
    if (decId === "sXnL9MQIry") {
      const b = Array.from("pWB9V)[*4I`nJpp?ozyB~dbr9yt!_n4u").map(c => c.charCodeAt(0));
      const d = a.match(/.{2}/g).map(x => parseInt(x, 16));
      const decrypted = d.map((v, i) => (v ^ b[i % b.length]) - 3);
      return atob(String.fromCharCode(...decrypted));
    }
    if (decId === "IhWrImMIGL") {
      const d = Array.from(a).map(ch => {
        const code = ch.charCodeAt(0);
        if (code >= 97 && code <= 109 || code >= 65 && code <= 77)
          return String.fromCharCode(code + 13);
        if (code >= 110 && code <= 122 || code >= 78 && code <= 90)
          return String.fromCharCode(code - 13);
        return ch;
      }).join("");
      return atob(d);
    }
    if (decId === "xTyBxQyGTA") {
      const b = a.split("").reverse().join("");
      let c = "";
      for (let i = 0; i < b.length; i += 2)
        c += b[i];
      return atob(c);
    }
    if (["JoAHUMCLXV", "Oi3v1dAlaM", "TsA2KGDGux"].includes(decId)) {
      const shift = { "JoAHUMCLXV": 3, "Oi3v1dAlaM": 5, "TsA2KGDGux": 7 }[decId];
      const b64 = a.split("").reverse().join("").replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(b64);
      return Array.from(decoded).map(ch => String.fromCharCode(ch.charCodeAt(0) - shift)).join("");
    }
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = { resolve };
