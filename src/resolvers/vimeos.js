const { fetchHtml, fetchJson, getSessionUA } = require('../utils/http.js');

async function resolve(embedUrl, signal = null) {
  const UA = getSessionUA();
  try {
    console.log("[Vimeos] Resolviendo: " + embedUrl);
    var html = await fetchHtml(embedUrl, {
      signal,
      headers: {
        "User-Agent": UA,
        "Referer": "https://vimeos.net/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-MX,es;q=0.9,en-US;q=0.8"
      }
    });
    var vimeoIdMatch = html.match(/vimeo\.com\/video\/(\d+)/i);
    if (!vimeoIdMatch)
      vimeoIdMatch = embedUrl.match(/\/(\d{7,10})/);
    if (vimeoIdMatch) {
      var vimeoId = vimeoIdMatch[1];
      try {
        var config = await fetchJson("https://player.vimeo.com/video/" + vimeoId + "/config", {
          signal,
          headers: { "User-Agent": UA, "Referer": embedUrl }
        });
        var hlsUrl = null;
        if (config && config.request && config.request.files && config.request.files.hls && config.request.files.hls.cdns && config.request.files.hls.cdns.default) {
          hlsUrl = config.request.files.hls.cdns.default.url;
        }
        if (hlsUrl) {
          return {
            url: hlsUrl,
            verified: true,
            serverName: "Vimeos",
            headers: { "User-Agent": UA, "Referer": "https://player.vimeo.com/", "Accept-Language": "es-MX,es;q=0.9" }
          };
        }
        var progressive = config && config.request && config.request.files ? config.request.files.progressive : null;
        if (progressive && progressive.length > 0) {
          var best = progressive.sort(function(a, b) {
            return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
          })[0];
          return {
            url: best.url,
            quality: best.quality ? best.quality + "p" : "1080p",
            serverName: "Vimeos",
            headers: { "User-Agent": UA, "Referer": "https://player.vimeo.com/", "Accept-Language": "es-MX,es;q=0.9" }
          };
        }
      } catch (e) {
      }
    }
    var packMatch = html.match(/eval\(function\(p,a,c,k,e,[dr]\)\{[\s\S]+?\}\('([\s\S]+?)',(\d+),(\d+),'([\s\S]+?)'\.split\('\|'\)/);
    if (packMatch) {
      console.log("[Vimeos] Usando Unpacker...");
      var payload = packMatch[1];
      var radix = parseInt(packMatch[2]);
      var symtab = packMatch[4].split("|");
      var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      var unbase = function(str) {
        var result = 0;
        for (var i = 0; i < str.length; i++)
          result = result * radix + chars.indexOf(str[i]);
        return result;
      };
      var unpacked = payload.replace(/\b(\w+)\b/g, function(match) {
        var idx = unbase(match);
        return symtab[idx] && symtab[idx] !== "" ? symtab[idx] : match;
      });
      var m3u8Match = unpacked.match(/["']([^"']+\.m3u8[^"']*)['"]/i);
      if (m3u8Match) {
        return {
          url: m3u8Match[1],
          verified: true,
          serverName: "Vimeos",
          headers: { "User-Agent": UA, "Referer": embedUrl }
        };
      }
    }
    return null;
  } catch (e) {
    console.error("[Vimeos] Error:", e.message);
    return null;
  }
}

module.exports = { resolve };