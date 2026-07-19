/**
 * flixlatam-diag - Built from src/flixlatam-diag/
 * Generated: 2026-07-19T06:59:43.477Z
 */
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/flixlatam-diag/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var passthrough = { "User-Agent": UA };
    var diagCounter = 0;
    function diagStream(step, label) {
      diagCounter++;
      return { url: "https://flixlatam-diag-" + step + "-" + diagCounter + ".mp4", quality: "240p", name: "FiDiag", title: label, headers: passthrough };
    }
    var out = [];
    out.push(diagStream(0, "Loaded"));
    try {
      var CryptoJS = require("crypto-js");
      var hash = CryptoJS.SHA256("test").toString(CryptoJS.enc.Hex);
      if (hash && hash.length > 10)
        out.push(diagStream(1, "CryptoJS-OK"));
      else
        out.push(diagStream(1, "CryptoJS-BadHash"));
    } catch (e) {
      out.push(diagStream(1, "CryptoJS-Fail"));
    }
    try {
      var cheerio = require("cheerio-without-node-native");
      var $ = cheerio.load("<p>x</p>");
      if ($("p").text() === "x")
        out.push(diagStream(2, "Cheerio-OK"));
      else
        out.push(diagStream(2, "Cheerio-BadParse"));
    } catch (e) {
      out.push(diagStream(2, "Cheerio-Fail"));
    }
    try {
      var resp = yield fetch("https://flixlatam.com", {
        headers: { "User-Agent": UA, "Accept-Language": "es-MX,es;q=0.9" }
      });
      if (resp.ok)
        out.push(diagStream(3, "FetchFlix-OK"));
      else
        out.push(diagStream(3, "FetchFlix-Status" + resp.status));
    } catch (e) {
      out.push(diagStream(3, "FetchFlix-Error"));
    }
    try {
      var s = yield fetch("https://flixlatam.com/search?s=Matrix", {
        headers: { "User-Agent": UA, "Referer": "https://flixlatam.com/", "Accept-Language": "es-MX,es;q=0.9" }
      });
      if (s.ok)
        out.push(diagStream(4, "Search-OK"));
      else
        out.push(diagStream(4, "Search-Status" + s.status));
    } catch (e) {
      out.push(diagStream(4, "Search-Error"));
    }
    try {
      var tmdbResp = yield fetch("https://api.themoviedb.org/3/movie/603?api_key=439c478a771f35c05022f9feabcca01c&language=es-MX");
      if (tmdbResp.ok)
        out.push(diagStream(5, "TMDB-OK"));
      else
        out.push(diagStream(5, "TMDB-Status" + tmdbResp.status));
    } catch (e) {
      out.push(diagStream(5, "TMDB-Error"));
    }
    try {
      var c = yield fetch("https://flixlatam.com/pelicula/matrix", {
        headers: { "User-Agent": UA, "Referer": "https://flixlatam.com/search?s=Matrix", "Accept-Language": "es-MX,es;q=0.9" }
      });
      if (!c.ok) {
        out.push(diagStream(6, "Content-Status" + c.status));
        return out;
      }
      var cHtml = yield c.text();
      var m = cHtml.match(/<iframe[^>]*src=["']([^"']*\/vidurl\/[^"']+?)["']/i);
      if (!m) {
        out.push(diagStream(6, "NoIframe"));
        return out;
      }
      out.push(diagStream(6, "Iframe-OK"));
      var vUrl = m[1].startsWith("http") ? m[1] : "https://flixlatam.com" + m[1];
      var v = yield fetch(vUrl, {
        headers: { "User-Agent": UA, "Referer": "https://flixlatam.com/pelicula/matrix", "Accept-Language": "es-MX,es;q=0.9" }
      });
      if (!v.ok) {
        out.push(diagStream(6, "Vidurl-Status" + v.status));
        return out;
      }
      var vHtml = yield v.text();
      var pwC = vHtml.match(/const\s+POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/);
      var pwD = vHtml.match(/const\s+POW_DIFFICULTY\s*=\s*(\d+)/);
      var pwS = vHtml.match(/const\s+POW_SALT\s*=\s*['"]([^'"]+)['"]/);
      var dl = vHtml.match(/(?:let|const|var)\s+dataLink\s*=\s*(\[[\s\S]*?\])\s*;/);
      if (!pwC || !pwD || !pwS || !dl) {
        out.push(diagStream(6, "PowParams-Miss"));
        return out;
      }
      out.push(diagStream(6, "Vidurl-OK"));
      var difficulty = parseInt(pwD[1]);
      var prefix = "0".repeat(difficulty);
      var MAX_ITER = 5e5;
      var solved = false;
      for (var n = 0; n < MAX_ITER; n++) {
        var h = CryptoJS.SHA256(pwC[1] + n.toString()).toString(CryptoJS.enc.Hex);
        if (h.startsWith(prefix)) {
          solved = true;
          out.push(diagStream(7, "PoW-OK-n" + n));
          break;
        }
      }
      if (!solved) {
        out.push(diagStream(7, "PoW-Exhausted"));
        return out;
      }
      var dataLink;
      try {
        dataLink = JSON.parse(dl[1].replace(/\\\//g, "/"));
      } catch (e) {
        out.push(diagStream(8, "DataLink-ParseFail"));
        return out;
      }
      if (!Array.isArray(dataLink))
        dataLink = [dataLink];
      out.push(diagStream(8, "DataLink-" + dataLink.length + "items"));
      var aesKey = CryptoJS.SHA256(pwC[1] + n.toString() + pwS[1]);
      var latCount = 0;
      for (var item of dataLink) {
        if ((item.video_language || "").toUpperCase() !== "LAT")
          continue;
        if (!item.sortedEmbeds || !Array.isArray(item.sortedEmbeds))
          continue;
        for (var emb of item.sortedEmbeds) {
          if (!emb.link)
            continue;
          try {
            var rawB64 = CryptoJS.enc.Base64.parse(emb.link);
            var iv = CryptoJS.lib.WordArray.create(rawB64.words.slice(0, 4), 16);
            var ct = CryptoJS.lib.WordArray.create(rawB64.words.slice(4), rawB64.sigBytes - 16);
            var dec = CryptoJS.AES.decrypt({ ciphertext: ct }, aesKey, { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            var decUrl = dec.toString(CryptoJS.enc.Utf8);
            if (decUrl && decUrl.startsWith("http"))
              latCount++;
          } catch (e) {
          }
        }
      }
      out.push(diagStream(8, "Decrypted-" + latCount + "urls"));
    } catch (e) {
      out.push(diagStream(9, "Pipeline-Fail"));
    }
    return out;
  });
}
module.exports = { getStreams };
