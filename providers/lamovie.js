/**
 * lamovie - Built from src/lamovie/
 * Generated: 2026-05-05T22:20:12.099Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
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

// src/utils/http.js
var require_http = __commonJS({
  "src/utils/http.js"(exports2, module2) {
    var DEFAULT_CHROME_UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var sessionUA = null;
    function setSessionUA(ua) {
      sessionUA = ua;
    }
    function getSessionUA2() {
      return sessionUA || DEFAULT_CHROME_UA;
    }
    function getStealthHeaders() {
      return {
        "User-Agent": getSessionUA2(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "es-US,es;q=0.9,en-US;q=0.8,en;q=0.7,es-419;q=0.6",
        "Connection": "keep-alive",
        "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Android"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      };
    }
    var DEFAULT_UA = getSessionUA2();
    var MOBILE_UA = getSessionUA2();
    function request(_0) {
      return __async(this, arguments, function* (url, options = {}) {
        const opt = options || {};
        const currentUA = opt.headers && opt.headers["User-Agent"] ? opt.headers["User-Agent"] : getSessionUA2();
        const headers = Object.assign({
          "User-Agent": currentUA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "es-MX,es;q=0.9,en;q=0.8"
        }, opt.headers);
        try {
          const fetchOptions = Object.assign({
            redirect: opt.redirect || "follow",
            skipSizeCheck: true
          }, opt, {
            headers
          });
          const response = yield fetch(url, fetchOptions);
          if (opt.redirect === "manual" && (response.status === 301 || response.status === 302)) {
            const redirectUrl = response.headers.get("location");
            console.log(`[HTTP] Redirecci\xF3n detectada (Manual): ${redirectUrl}`);
            return { status: response.status, redirectUrl, ok: false };
          }
          if (!response.ok && !opt.ignoreErrors) {
            console.warn("[HTTP] Error " + response.status + " en " + url);
          }
          return response;
        } catch (error) {
          console.error("[HTTP] Error en " + url + ": " + error.message);
          throw error;
        }
      });
    }
    function fetchHtml2(url, options) {
      return __async(this, null, function* () {
        const res = yield request(url, options);
        return yield res.text();
      });
    }
    function fetchJson2(url, options) {
      return __async(this, null, function* () {
        const res = yield request(url, options);
        return yield res.json();
      });
    }
    module2.exports = {
      request,
      fetchHtml: fetchHtml2,
      fetchJson: fetchJson2,
      getSessionUA: getSessionUA2,
      setSessionUA,
      getStealthHeaders,
      DEFAULT_UA,
      MOBILE_UA
    };
  }
});

// src/utils/m3u8.js
var require_m3u8 = __commonJS({
  "src/utils/m3u8.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
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
    var VALIDATION_CACHE = /* @__PURE__ */ new Map();
    function validateStream(stream, signal = null) {
      return __async(this, null, function* () {
        if (!stream || !stream.url)
          return stream;
        const { url, headers } = stream;
        const isMp4 = url.toLowerCase().includes(".mp4");
        if (VALIDATION_CACHE.has(url))
          return __spreadValues(__spreadValues({}, stream), VALIDATION_CACHE.get(url));
        try {
          const fetchOptions = {
            method: isMp4 ? "HEAD" : "GET",
            headers: __spreadValues({
              "User-Agent": getSessionUA2()
            }, headers || {})
          };
          if (signal)
            fetchOptions.signal = signal;
          const response = yield fetch(url, fetchOptions);
          if (!response.ok)
            return __spreadProps(__spreadValues({}, stream), { verified: false });
          if (isMp4) {
            const resultData2 = { verified: true, quality: stream.quality || "1080p", isReal: true };
            VALIDATION_CACHE.set(url, resultData2);
            return __spreadValues(__spreadValues({}, stream), resultData2);
          }
          const text = yield response.text();
          const info = parseBestQuality(text, url);
          const resultData = {
            verified: true,
            quality: info.quality,
            isReal: info.isReal
          };
          VALIDATION_CACHE.set(url, resultData);
          return __spreadValues(__spreadValues({}, stream), resultData);
        } catch (error) {
          const info = parseBestQuality("", url);
          const resultData = { quality: info.quality, verified: true, isReal: false };
          VALIDATION_CACHE.set(url, resultData);
          return __spreadValues(__spreadValues({}, stream), resultData);
        }
      });
    }
    module2.exports = { validateStream, getQualityFromHeight };
  }
});

// src/utils/sorting.js
var require_sorting = __commonJS({
  "src/utils/sorting.js"(exports2, module2) {
    var QUALITY_SCORE = {
      "4K": 100,
      "1440p": 90,
      "1080p": 80,
      "720p": 70,
      "480p": 60,
      "360p": 50,
      "240p": 40,
      "Auto": 30,
      "Unknown": 0
    };
    var SERVER_SCORE = {
      "VOE": 10,
      "Filemoon": 10,
      "Tplayer": 10,
      "Vimeos": 10,
      "Netu": 5,
      "GoodStream": 10,
      "StreamWish": -5,
      "VidHide": -5,
      "Supervideo": 10
    };
    function sortStreamsByQuality(streams) {
      if (!Array.isArray(streams))
        return [];
      return [...streams].sort((a, b) => {
        const scoreA = QUALITY_SCORE[a.quality] || 0;
        const scoreB = QUALITY_SCORE[b.quality] || 0;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        const serverA = (a.serverLabel || "").split(" ")[0];
        const serverB = (b.serverLabel || "").split(" ")[0];
        const speedA = SERVER_SCORE[serverA] || 0;
        const speedB = SERVER_SCORE[serverB] || 0;
        if (speedA !== speedB) {
          return speedB - speedA;
        }
        if (a.verified && !b.verified)
          return -1;
        if (!a.verified && b.verified)
          return 1;
        return 0;
      });
    }
    module2.exports = { sortStreamsByQuality };
  }
});

// src/utils/mirrors.js
var require_mirrors = __commonJS({
  "src/utils/mirrors.js"(exports2, module2) {
    var MIRRORS = {
      VIDHIDE: [
        "vidhide",
        "minochinos",
        "vadisov",
        "vaiditv",
        "amusemre",
        "callistanise",
        "vhaudm",
        "mdfury",
        "dintezuvio",
        "acek-cdn",
        "vedonm",
        "masukestin",
        "vidoza"
      ],
      STREAMWISH: [
        "hlswish",
        "streamwish",
        "hglink",
        "hglamioz",
        "hglink.to",
        "audinifer",
        "embedwish",
        "awish",
        "dwish",
        "strwish",
        "filelions",
        "wishembed",
        "wishfast",
        "hanerix"
      ],
      FILEMOON: [
        "filemoon",
        "moonalu",
        "moonembed",
        "bysedikamoum",
        "r66nv9ed",
        "398fitus",
        "filemoon.sx",
        "filemoon.to",
        "filemoon.lat",
        "filemoon.live",
        "filemoon.online",
        "filemoon.me",
        "bysedikamoum.com",
        "r66nv9ed.com",
        "398fitus.com",
        "fmoon.top"
      ],
      VOE: [
        "voe.sx",
        "voe-sx",
        "voex.sx"
      ],
      FASTREAM: [
        "fastream",
        "fastplay",
        "fembed"
      ],
      OKRU: [
        "ok.ru",
        "okru"
      ],
      PIXELDRAIN: [
        "pixeldrain"
      ],
      BUZZHEAVIER: [
        "buzzheavier",
        "bzh.sh"
      ],
      GOODSTREAM: [
        "goodstream",
        "gs.one"
      ],
      LULUSTREAM: [
        "lulustream",
        "luluvdo",
        "luluvids",
        "pondy",
        "lulupuv"
      ],
      SEEKSTREAMING: [
        "seekplays",
        "seekstreaming",
        "embedseek"
      ],
      DROPCDN: [
        "dropcdn.io",
        "dropload.io",
        "dropcdn",
        "dropload",
        "dr0pstream"
      ],
      DOODSTREAM: [
        "dood.li",
        "dood.la",
        "ds2video.com",
        "ds2play.com",
        "dood.yt",
        "dood.ws",
        "dood.so",
        "dood.to",
        "dood.pm",
        "dood.watch",
        "dood.sh",
        "dood.cx",
        "dood.wf",
        "dood.re",
        "dood.one",
        "dood.tech",
        "dood.work",
        "dooods.pro",
        "dooood.com",
        "doodstream.com",
        "doodstream.co",
        "d000d.com",
        "d0000d.com",
        "doodapi.com",
        "d0o0d.com",
        "do0od.com",
        "dooodster.com",
        "vidply.com",
        "do7go.com",
        "all3do.com",
        "doply.net",
        "dsvplay.com"
      ]
    };
    function isMirror(url, groupName) {
      if (!url || !MIRRORS[groupName])
        return false;
      const s = url.toLowerCase();
      return MIRRORS[groupName].some((m) => s.includes(m));
    }
    module2.exports = { MIRRORS, isMirror };
  }
});

// src/utils/engine.js
var require_engine = __commonJS({
  "src/utils/engine.js"(exports2, module2) {
    var { validateStream } = require_m3u8();
    var { sortStreamsByQuality } = require_sorting();
    var { isMirror } = require_mirrors();
    function normalizeLanguage(lang) {
      const l = (lang || "").toLowerCase();
      if (l === "latino" || l === "espa\xF1ol" || l === "lat" || l === "auto") {
        return "Latino";
      }
      if (l.includes("lat") || l.includes("mex") || l.includes("col") || l.includes("arg") || l.includes("chi") || l.includes("per") || l.includes("dub") || l.includes("dual")) {
        return "Latino";
      }
      if (l.includes("esp") || l.includes("cas") || l.includes("spa") || l.includes("cast") || l === "esp") {
        return "Espa\xF1ol";
      }
      if (l.includes("sub") || l.includes("vose") || l === "sub") {
        return "Subtitulado";
      }
      if (l.includes("eng") || l.includes("en-us") || l === "en") {
        return "Ingl\xE9s";
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
        } catch (e) {
        }
      }
      return server || "Servidor";
    }
    function finalizeStreams2(streams, providerName, mediaTitle) {
      return __async(this, null, function* () {
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
          const batchResults = yield Promise.all(batch.map((s) => __async(this, null, function* () {
            try {
              if (s.isReal === true)
                return s;
              if (s.url && (s.url.includes(".m3u8") || s.url.includes(".mp4"))) {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2500);
                try {
                  const validated = yield validateStream(s, controller.signal);
                  clearTimeout(timeoutId);
                  return validated;
                } catch (e) {
                  clearTimeout(timeoutId);
                  return __spreadProps(__spreadValues({}, s), { verified: false, isReal: false });
                }
              }
            } catch (e) {
            }
            return s;
          })));
          validatedStreams.push(...batchResults);
        }
        const processed = [];
        const seenTitles = /* @__PURE__ */ new Set();
        for (const s of validatedStreams) {
          if (!s)
            continue;
          const rawLang = normalizeLanguage(s.lang || s.Audio || s.langLabel || s.language || s.audio || "Latino");
          const l = rawLang.toLowerCase();
          const isLatino = l.includes("latino") || l.includes("espa\xF1ol");
          if (!isLatino && providerName !== "FuegoCine")
            continue;
          const server = normalizeServer(s.serverLabel || s.serverName || s.servername, s.url, s.serverName);
          const quality = s.quality || "HD";
          const isReal = s.isReal === true;
          const isVerified = s.verified === true;
          const checkMark = isReal ? " \u2705" : "";
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
      });
    }
    module2.exports = { finalizeStreams: finalizeStreams2, normalizeLanguage };
  }
});

// src/resolvers/voe.js
var require_voe = __commonJS({
  "src/resolvers/voe.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    var { validateStream } = require_m3u8();
    function localAtob(input) {
      if (!input)
        return "";
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let str = String(input).replace(/=+$/, "").replace(/[\s\n\r\t]/g, "");
      let output = "";
      if (str.length % 4 === 1)
        return "";
      for (let bc = 0, bs, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = chars.indexOf(buffer);
      }
      return output;
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const currentUA = getSessionUA2();
          console.log(`[VOE] TV-Resolving: ${url}`);
          const response = yield fetch(url, {
            headers: { "User-Agent": currentUA },
            signal
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          if (html.includes("window.location.href") && html.length < 2e3) {
            const rm = html.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/i);
            if (rm)
              return resolve(rm[1]);
          }
          const jsonMatch = html.match(/<script type="application\/json">([\s\S]*?)<\/script>/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[1].trim());
              let encText = Array.isArray(parsed) ? parsed[0] : parsed;
              if (typeof encText !== "string")
                return null;
              let decoded = encText.replace(/[a-zA-Z]/g, (c) => {
                const code = c.charCodeAt(0);
                const limit = c <= "Z" ? 90 : 122;
                const shifted = code + 13;
                return String.fromCharCode(limit >= shifted ? shifted : shifted - 26);
              });
              const noise = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
              for (const n of noise)
                decoded = decoded.split(n).join("");
              const b64_1 = localAtob(decoded);
              if (!b64_1)
                throw new Error("LocalAtob failed stage 1");
              let shiftedStr = "";
              for (let j = 0; j < b64_1.length; j++) {
                shiftedStr += String.fromCharCode(b64_1.charCodeAt(j) - 3);
              }
              const reversed = shiftedStr.split("").reverse().join("");
              const decrypted = localAtob(reversed);
              if (!decrypted)
                throw new Error("LocalAtob failed stage 2");
              const data = JSON.parse(decrypted);
              if (data && data.source) {
                console.log(`[VOE] Success: ${data.source.substring(0, 50)}...`);
                const reqHeaders = {
                  "User-Agent": currentUA,
                  "Referer": url
                };
                const streamObj = { url: data.source, headers: reqHeaders };
                const validation = yield validateStream(streamObj, signal);
                const isLive = validation ? validation.verified : true;
                const streamQuality = validation && validation.quality ? validation.quality : "1080p";
                return {
                  url: data.source,
                  quality: streamQuality,
                  verified: isLive,
                  isReal: validation ? validation.isReal : false,
                  serverName: "VOE",
                  headers: reqHeaders
                };
              }
            } catch (ex) {
              console.error(`[VOE] Decryption failed (QuickJS Match): ${ex.message}`);
            }
          }
          const m3u8Match = html.match(/["'](https?:\/\/[^"']+?\.m3u8[^"']*?)["']/i);
          if (m3u8Match) {
            const fallbackUrl = m3u8Match[1];
            const reqHeaders = {
              "Referer": url,
              "User-Agent": currentUA
            };
            const streamObj = { url: fallbackUrl, headers: reqHeaders };
            const validation = yield validateStream(streamObj, signal);
            const isLive = validation ? validation.verified : true;
            const streamQuality = validation && validation.quality ? validation.quality : "1080p";
            return {
              url: fallbackUrl,
              quality: streamQuality,
              verified: isLive,
              isReal: validation ? validation.isReal : false,
              serverName: "VOE",
              headers: reqHeaders
            };
          }
          return null;
        } catch (error) {
          console.error(`[VOE] Error: ${error.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/hlswish.js
var require_hlswish = __commonJS({
  "src/resolvers/hlswish.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    var { validateStream } = require_m3u8();
    function unpackEval(payload, radix, symtab) {
      const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const unbase = (str) => {
        let result = 0;
        for (let i = 0; i < str.length; i++) {
          const pos = chars.indexOf(str[i]);
          if (pos === -1)
            return NaN;
          result = result * radix + pos;
        }
        return result;
      };
      return payload.replace(/\b([0-9a-zA-Z]+)\b/g, (match) => {
        const idx = unbase(match);
        if (isNaN(idx) || idx >= symtab.length)
          return match;
        return symtab[idx] && symtab[idx] !== "" ? symtab[idx] : match;
      });
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA = getSessionUA2();
          const rawId = url.split("/").pop().replace(/\.html$/, "");
          const urlObj = new URL(url);
          const mirrors = [
            `https://hanerix.com/e/${rawId}`,
            `https://embedwish.com/e/${rawId}`,
            `https://hglink.to/e/${rawId}`,
            url,
            `https://streamwish.to/e/${rawId}`,
            `https://awish.pro/e/${rawId}`,
            `https://strwish.com/e/${rawId}`,
            `https://wishfast.top/e/${rawId}`,
            `https://sfastwish.com/e/${rawId}`
          ];
          console.log(`[StreamWish] Race-Resolving v7.9.4: ${rawId} (${mirrors.length} mirrors)`);
          const validResult = yield new Promise((resolveRace) => {
            let resolved = false;
            let pending = mirrors.length;
            mirrors.forEach((mirror) => __async(this, null, function* () {
              try {
                const mirrorObj = new URL(mirror);
                const mirrorOrigin = mirrorObj.origin;
                const resp = yield fetch(mirror, {
                  headers: { "Referer": mirror, "User-Agent": UA },
                  signal
                });
                if (!resp.ok)
                  throw new Error();
                const html = yield resp.text();
                let m3u8Url = null;
                const hashMatch = html.match(/[0-9a-f]{32}/i);
                if (hashMatch) {
                  const hash = hashMatch[0];
                  const dlUrl = `${mirrorOrigin}/dl?op=view&file_code=${rawId}&hash=${hash}&embed=1&referer=&adb=1&hls4=1`;
                  const dlResp = yield fetch(dlUrl, {
                    headers: { "User-Agent": UA, "Referer": mirror, "X-Requested-With": "XMLHttpRequest" },
                    signal
                  });
                  if (dlResp.ok) {
                    const dlData = yield dlResp.text();
                    const match = dlData.match(/https?:\/\/[^"']+\.m3u8[^"']*/);
                    if (match)
                      m3u8Url = match[0];
                  }
                }
                if (!m3u8Url) {
                  const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[a-z]\)\{[\s\S]*?\}\s*\('([\s\S]+?)',\s*(\d+),\s*(\d+),\s*'([\s\S]+?)'\.split\('\|'\)/);
                  if (packedMatch) {
                    const unpacked = unpackEval(packedMatch[1], parseInt(packedMatch[2]), packedMatch[4].split("|"));
                    const match = unpacked.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/);
                    if (match)
                      m3u8Url = match[0];
                  }
                }
                if (!m3u8Url) {
                  const fileMatch = html.match(/file\s*:\s*["']([^"']+)["']/i);
                  if (fileMatch)
                    m3u8Url = fileMatch[1];
                }
                if (m3u8Url && !resolved) {
                  resolved = true;
                  m3u8Url = m3u8Url.replace(/\\/g, "");
                  if (m3u8Url.startsWith("/"))
                    m3u8Url = mirrorOrigin + m3u8Url;
                  resolveRace({ url: m3u8Url, mirror });
                }
              } catch (e) {
              } finally {
                pending--;
                if (pending === 0 && !resolved)
                  resolveRace(null);
              }
            }));
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                resolveRace(null);
              }
            }, 3500);
          });
          if (!validResult)
            return null;
          const reqHeaders = {
            "Referer": validResult.mirror,
            "Origin": new URL(validResult.mirror).origin,
            "User-Agent": UA
          };
          const streamObj = { url: validResult.url, headers: reqHeaders };
          const validation = yield validateStream(streamObj, signal);
          const isLive = validation ? validation.verified : true;
          const streamQuality = validation && validation.quality ? validation.quality : "Auto";
          return {
            url: validResult.url,
            quality: streamQuality,
            verified: isLive,
            isReal: validation ? validation.isReal : false,
            serverName: "StreamWish",
            headers: reqHeaders
          };
        } catch (e) {
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/utils/aes_gcm.js
var require_aes_gcm = __commonJS({
  "src/utils/aes_gcm.js"(exports2, module2) {
    var _CryptoJS = typeof CryptoJS !== "undefined" ? CryptoJS : null;
    function parseB64(b64) {
      if (!b64 || !_CryptoJS)
        return null;
      try {
        const normalized = b64.replace(/-/g, "+").replace(/_/g, "/");
        return _CryptoJS.enc.Base64.parse(normalized);
      } catch (e) {
        return null;
      }
    }
    function decryptGCM(keyWA, ivWA, ciphertextWithTagWA) {
      try {
        if (!keyWA || !ivWA || !ciphertextWithTagWA || !_CryptoJS)
          return null;
        const tagSizeWords = 4;
        const ciphertextWords = ciphertextWithTagWA.words.slice(0, ciphertextWithTagWA.words.length - tagSizeWords);
        const ciphertextWA = _CryptoJS.lib.WordArray.create(
          ciphertextWords,
          ciphertextWithTagWA.sigBytes - 16
        );
        let counterWA = ivWA.clone();
        counterWA.concat(_CryptoJS.lib.WordArray.create([2], 4));
        const decrypted = _CryptoJS.AES.decrypt(
          { ciphertext: ciphertextWA },
          keyWA,
          {
            iv: counterWA,
            mode: _CryptoJS.mode.CTR,
            padding: _CryptoJS.pad.NoPadding
          }
        );
        return decrypted.toString(_CryptoJS.enc.Utf8);
      } catch (e) {
        console.error("[AES-GCM] Error:", e.message);
        return null;
      }
    }
    function decryptByse(playback) {
      try {
        if (!playback || !playback.key_parts || !playback.payload || !playback.iv || !_CryptoJS)
          return null;
        let keyWA = parseB64(playback.key_parts[0]);
        for (let i = 1; i < playback.key_parts.length; i++) {
          const part = parseB64(playback.key_parts[i]);
          if (part)
            keyWA.concat(part);
        }
        const ivWA = parseB64(playback.iv);
        const ciphertextWithTagWA = parseB64(playback.payload);
        return decryptGCM(keyWA, ivWA, ciphertextWithTagWA);
      } catch (e) {
        console.error("[Byse] Failed:", e.message);
        return null;
      }
    }
    module2.exports = { decryptByse };
  }
});

// src/resolvers/filemoon.js
var require_filemoon = __commonJS({
  "src/resolvers/filemoon.js"(exports2, module2) {
    var { decryptByse } = require_aes_gcm();
    var { getSessionUA: getSessionUA2 } = require_http();
    var UA_CHROME = getSessionUA2();
    function unpack(p, a, c, k, e, d) {
      while (c--)
        if (k[c])
          p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
      return p;
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d;
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          const videoId = urlObj.pathname.split("/").filter((p) => !!p).pop();
          if (!videoId)
            return null;
          console.log(`[Filemoon] TV-Resolving: ${videoId} Host: ${hostname}`);
          try {
            const playbackUrl = `https://${hostname}/api/videos/${videoId}/embed/playback`;
            const response = yield fetch(playbackUrl, {
              signal,
              headers: {
                "User-Agent": UA_CHROME,
                "Referer": url,
                "Origin": `https://${hostname}`,
                "X-Embed-Parent": url
              }
            });
            if (response.ok) {
              const playbackData = yield response.json();
              if (playbackData && playbackData.playback) {
                const decrypted = decryptByse(playbackData.playback);
                if (decrypted) {
                  const data = decrypted.includes("{") ? JSON.parse(decrypted) : null;
                  const directUrl = ((_b = (_a = data == null ? void 0 : data.sources) == null ? void 0 : _a[0]) == null ? void 0 : _b.url) || (data == null ? void 0 : data.url);
                  if (directUrl) {
                    try {
                      const vCheck = yield fetch(directUrl, { method: "HEAD", headers: { "User-Agent": UA_CHROME } });
                      if (vCheck.status === 404) {
                        console.log("[Filemoon] \u274C URL de video caducada (404).");
                        return null;
                      }
                    } catch (ve) {
                    }
                    return {
                      url: directUrl,
                      quality: ((_d = (_c = data == null ? void 0 : data.sources) == null ? void 0 : _c[0]) == null ? void 0 : _d.label) || "1080p",
                      verified: true,
                      serverName: "Filemoon",
                      headers: { "User-Agent": UA_CHROME, "Referer": `https://${hostname}/`, "Origin": `https://${hostname}`, "x-embed-origin": "ww3.gnulahd.nu" }
                    };
                  }
                }
              }
            }
          } catch (e) {
            console.log(`[Filemoon] Shield Fall\xF3: ${e.message}`);
          }
          const resp = yield fetch(url, { headers: { "User-Agent": UA_CHROME, "Referer": urlObj.origin } });
          const html1 = yield resp.text();
          const evalMatch = html1.match(/eval\(function\(p,a,c,k,e,(?:d|\w+)\)\{[\s\S]+?\}\s*\(([\s\S]+?)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([\s\S]+?)'\.split/);
          if (evalMatch) {
            const unpacked = unpack(evalMatch[1], parseInt(evalMatch[2]), parseInt(evalMatch[3]), evalMatch[4].split("|"), 0, {});
            const m3u8Match = unpacked.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/i);
            if (m3u8Match) {
              return {
                url: m3u8Match[1],
                verified: true,
                serverName: "Filemoon",
                headers: {
                  "User-Agent": UA_CHROME,
                  "Referer": `https://${hostname}`,
                  "Origin": `https://${hostname}`
                }
              };
            }
          }
          return null;
        } catch (error) {
          console.error(`[Filemoon] Error: ${error.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vidhide.js
var require_vidhide = __commonJS({
  "src/resolvers/vidhide.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2, getStealthHeaders } = require_http();
    var { validateStream } = require_m3u8();
    function unpackVidHide(script) {
      try {
        const match = script.match(/eval\(function\(p,a,c,k,e,[rd]\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/);
        if (!match)
          return null;
        let [full, p, a, c, k] = match;
        a = parseInt(a);
        c = parseInt(c);
        k = k.split("|");
        const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        const decode = (l, s) => {
          let res = "";
          while (l > 0) {
            res = chars[l % s] + res;
            l = Math.floor(l / s);
          }
          return res || "0";
        };
        const unpacked = p.replace(/\b\w+\b/g, (l) => {
          const s = parseInt(l, 36);
          return s < k.length && k[s] ? k[s] : decode(s, a);
        });
        return unpacked;
      } catch (e) {
        return null;
      }
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const currentUA = getSessionUA2();
          console.log(`[VidHide] TV-Resolving: ${url}`);
          const urlObj = new URL(url);
          const domain = urlObj.hostname;
          const response = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": currentUA,
              "Referer": `https://${domain}/`
            }
          });
          if (!response.ok)
            return null;
          const html = yield response.text();
          let finalUrl = null;
          let quality = "1080p";
          const packedMatch = html.match(/eval\(function\(p,a,c,k,e,[rd]\)[\s\S]*?\.split\('\|'\)[^\)]*\)\)/);
          if (packedMatch) {
            const unpacked = unpackVidHide(packedMatch[0]);
            if (unpacked) {
              const hlsMatch = unpacked.match(/"hls[24]"\s*:\s*"([^"]+)"/);
              if (hlsMatch)
                finalUrl = hlsMatch[1];
              const labelMatch = unpacked.match(/\{label\s*:\s*"([^"]+)"/i) || unpacked.match(/name\s*:\s*"([^"]+)"/i);
              if (labelMatch)
                quality = labelMatch[1].toLowerCase().includes("p") ? labelMatch[1] : labelMatch[1] + "p";
            }
          }
          if (!finalUrl) {
            const rawMatch = html.match(/"hls[24]"\s*:\s*"([^"]+)"/) || html.match(/file\s*:\s*["']([^"']+)["']/i) || html.match(/["'](https?:\/\/[^"']+?\/stream\/[^"']+?\.m3u8[^"']*?)["']/i);
            if (rawMatch)
              finalUrl = rawMatch[1];
          }
          if (!finalUrl)
            return null;
          if (!finalUrl.startsWith("http"))
            finalUrl = new URL(url).origin + finalUrl;
          if (!finalUrl.includes("referer="))
            finalUrl += (finalUrl.includes("?") ? "&" : "?") + "referer=embed69.org";
          const reqHeaders = __spreadProps(__spreadValues({}, getStealthHeaders()), {
            "Referer": url.split("?")[0],
            "Origin": new URL(url).origin,
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": currentUA
          });
          const streamObj = { url: finalUrl, headers: reqHeaders };
          const validation = yield validateStream(streamObj, signal);
          const isLive = validation ? validation.verified : true;
          const streamQuality = validation && validation.quality ? validation.quality : quality;
          return {
            url: finalUrl,
            quality: streamQuality,
            verified: isLive,
            isReal: validation ? validation.isReal : false,
            serverName: "VidHide",
            headers: reqHeaders
          };
        } catch (e) {
          console.error(`[VidHide] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/doodstream.js
var require_doodstream = __commonJS({
  "src/resolvers/doodstream.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2 } = require_http();
    var RAND_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    function randomStr(len) {
      let r = "";
      for (let i = 0; i < len; i++)
        r += RAND_CHARS.charAt(Math.floor(Math.random() * RAND_CHARS.length));
      return r;
    }
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA = getSessionUA2();
          const urlObj = new URL(url);
          const domain = urlObj.origin;
          const pathMatch = urlObj.pathname.match(/\/[ed]\/([a-z0-9]+)/i);
          if (!pathMatch)
            return null;
          const videoId = pathMatch[1];
          const embedUrl = `${domain}/e/${videoId}`;
          const resp = yield fetch(embedUrl, {
            signal,
            headers: {
              "User-Agent": UA,
              "Referer": embedUrl,
              "Accept": "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          if (html.includes("Video not found")) {
            console.log("[DoodStream] Video not found");
            return null;
          }
          const passMatch = html.match(/\/pass_md5\/[^'"]+/);
          if (!passMatch)
            return null;
          const tokenMatch = html.match(/[?&]token=([a-z0-9]+)[&'"]/i);
          if (!tokenMatch)
            return null;
          const token = tokenMatch[1];
          const passUrl = `${domain}${passMatch[0]}`;
          const passResp = yield fetch(passUrl, {
            signal,
            headers: { "User-Agent": UA, "Referer": embedUrl }
          });
          if (!passResp.ok)
            return null;
          const baseUrl = (yield passResp.text()).trim();
          if (!baseUrl || baseUrl.length < 10)
            return null;
          const expiry = Date.now() * 1e3;
          const finalUrl = `${baseUrl}${randomStr(10)}?token=${token}&expiry=${expiry}`;
          return {
            url: finalUrl,
            quality: "1080p",
            serverName: "DoodStream",
            headers: {
              "User-Agent": UA,
              "Referer": domain,
              "Origin": domain
            }
          };
        } catch (e) {
          console.error(`[DoodStream] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/utils/packer.js
var require_packer = __commonJS({
  "src/utils/packer.js"(exports2, module2) {
    function unpackPacker(html) {
      const match = html.match(
        /eval\(function\(p,a,c,k,e,d\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
      );
      if (!match)
        return null;
      let [, p, a, c, k] = match;
      a = parseInt(a);
      c = parseInt(c);
      k = k.split("|");
      while (c--) {
        if (k[c])
          p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
      }
      return p;
    }
    module2.exports = { unpackPacker };
  }
});

// src/resolvers/dropcdn.js
var require_dropcdn = __commonJS({
  "src/resolvers/dropcdn.js"(exports2, module2) {
    var { unpackPacker } = require_packer();
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        try {
          const UA = getSessionUA2();
          const domain = new URL(url).origin;
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA,
              "Referer": domain,
              "Accept": "text/html,application/xhtml+xml"
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const unpacked = unpackPacker(html);
          if (!unpacked) {
            const directMatch = html.match(/file:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
            if (!directMatch)
              return null;
            return {
              url: directMatch[1],
              quality: "1080p",
              serverName: "DropCDN",
              headers: {
                "User-Agent": UA,
                "Referer": domain,
                "Origin": domain
              }
            };
          }
          const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
          if (!fileMatch)
            return null;
          return {
            url: fileMatch[1],
            quality: "1080p",
            serverName: "DropCDN",
            headers: {
              "User-Agent": UA,
              "Referer": domain,
              "Origin": domain
            }
          };
        } catch (e) {
          console.error(`[DropCDN] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/quality.js
var require_quality = __commonJS({
  "src/resolvers/quality.js"(exports2, module2) {
    var { request, getSessionUA: getSessionUA2 } = require_http();
    function detectQuality(_0) {
      return __async(this, arguments, function* (url, headers = {}) {
        try {
          if (!url || !url.includes(".m3u8"))
            return "1080p";
          const res = yield request(url, {
            timeout: 5e3,
            headers: __spreadValues({
              "User-Agent": getSessionUA2()
            }, headers)
          });
          const data = yield res.text();
          if (!data.includes("#EXT-X-STREAM-INF")) {
            const match = url.match(/[_-](\d{3,4})p/i);
            return match ? `${match[1]}p` : "1080p";
          }
          let maxRes = 0;
          const lines = data.split("\n");
          for (const line of lines) {
            const match = line.match(/RESOLUTION=\d+x(\d+)/i);
            if (match) {
              const res2 = parseInt(match[1]);
              if (res2 > maxRes)
                maxRes = res2;
            }
          }
          if (maxRes > 0) {
            if (maxRes >= 2160)
              return "4K";
            if (maxRes >= 1080)
              return "1080p";
            if (maxRes >= 720)
              return "720p";
            if (maxRes >= 480)
              return "480p";
            return `${maxRes}p`;
          }
          return "1080p";
        } catch (e) {
          return "1080p";
        }
      });
    }
    module2.exports = { detectQuality };
  }
});

// src/resolvers/goodstream.js
var require_goodstream = __commonJS({
  "src/resolvers/goodstream.js"(exports2, module2) {
    var { detectQuality } = require_quality();
    var { getSessionUA: getSessionUA2 } = require_http();
    function resolve(embedUrl) {
      return __async(this, null, function* () {
        try {
          const UA = getSessionUA2();
          console.log(`[GoodStream] Resolviendo: ${embedUrl}`);
          const response = yield fetch(embedUrl, {
            headers: {
              "User-Agent": UA,
              "Referer": "https://goodstream.one/",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "es-MX,es;q=0.9",
              "Connection": "keep-alive"
            }
          });
          const data = yield response.text();
          const match = data.match(/file:\s*"([^"]+)"/);
          if (!match) {
            console.log('[GoodStream] No se encontr\xF3 patr\xF3n file:"..."');
            return null;
          }
          const videoUrl = match[1];
          const refererHeaders = {
            "Referer": embedUrl,
            "Origin": "https://goodstream.one",
            "User-Agent": UA,
            "Accept-Language": "es-MX,es;q=0.9"
          };
          const quality = yield detectQuality(videoUrl, refererHeaders);
          console.log(`[GoodStream] URL encontrada (${quality}): ${videoUrl.substring(0, 80)}...`);
          return {
            url: videoUrl,
            quality: quality || "1080p",
            verified: !!quality,
            serverName: "GoodStream",
            headers: refererHeaders
          };
        } catch (err) {
          console.log(`[GoodStream] Error: ${err.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/fastream.js
var require_fastream = __commonJS({
  "src/resolvers/fastream.js"(exports2, module2) {
    var UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var { unpackPacker } = require_packer();
    function detectQuality(_0) {
      return __async(this, arguments, function* (m3u8Url, headers = {}) {
        try {
          const res = yield fetch(m3u8Url, {
            headers: __spreadValues({ "User-Agent": UA }, headers),
            redirect: "follow"
          });
          const data = yield res.text();
          if (!data.includes("#EXT-X-STREAM-INF")) {
            const match = m3u8Url.match(/[_-](\d{3,4})p/);
            return match ? `${match[1]}p` : "1080p";
          }
          let bestHeight = 0;
          const lines = data.split("\n");
          for (const line of lines) {
            const m = line.match(/RESOLUTION=\d+x(\d+)/);
            if (m) {
              const h = parseInt(m[1]);
              if (h > bestHeight)
                bestHeight = h;
            }
          }
          if (bestHeight >= 2160)
            return "4K";
          if (bestHeight >= 1080)
            return "1080p";
          if (bestHeight >= 720)
            return "720p";
          if (bestHeight >= 480)
            return "480p";
          return bestHeight > 0 ? `${bestHeight}p` : "1080p";
        } catch (e) {
          return "1080p";
        }
      });
    }
    function resolve(url) {
      return __async(this, null, function* () {
        var _a;
        try {
          const res = yield fetch(url, {
            headers: {
              "User-Agent": UA,
              "Referer": "https://www3.seriesmetro.net/"
            },
            redirect: "follow"
          });
          const data = yield res.text();
          const unpacked = unpackPacker(data);
          if (!unpacked)
            return null;
          const m3u8 = (_a = unpacked.match(/file:"(https?:\/\/[^"]+\.m3u8[^"]*)"/)) == null ? void 0 : _a[1];
          if (!m3u8)
            return null;
          const quality = yield detectQuality(m3u8, { "Referer": "https://fastream.to/" });
          return {
            url: m3u8,
            quality,
            headers: { "User-Agent": UA, "Referer": "https://fastream.to/" }
          };
        } catch (e) {
          console.error("[Fastream] Error:", e.message);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/vimeos.js
var require_vimeos = __commonJS({
  "src/resolvers/vimeos.js"(exports2, module2) {
    var { fetchHtml: fetchHtml2, fetchJson: fetchJson2, getSessionUA: getSessionUA2 } = require_http();
    function resolve(embedUrl) {
      return __async(this, null, function* () {
        const UA = getSessionUA2();
        try {
          console.log("[Vimeos] Resolviendo: " + embedUrl);
          var html = yield fetchHtml2(embedUrl, {
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
              var config = yield fetchJson2("https://player.vimeo.com/video/" + vimeoId + "/config", {
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
      });
    }
    module2.exports = { resolve };
  }
});

// src/resolvers/supervideo.js
var require_supervideo = __commonJS({
  "src/resolvers/supervideo.js"(exports2, module2) {
    var { getSessionUA: getSessionUA2, getStealthHeaders } = require_http();
    var { unpackPacker } = require_packer();
    var { validateStream } = require_m3u8();
    function resolve(url, signal = null) {
      return __async(this, null, function* () {
        var _a, _b;
        try {
          const UA = getSessionUA2();
          console.log(`[Supervideo] Resolving: ${url}`);
          const resp = yield fetch(url, {
            signal,
            headers: {
              "User-Agent": UA,
              "Referer": url
            }
          });
          if (!resp.ok)
            return null;
          const html = yield resp.text();
          const unpacked = unpackPacker(html);
          if (!unpacked)
            return null;
          const fileMatch = unpacked.match(/file\s*:\s*["']([^"']+?\.m3u8[^"']*)["']/i);
          if (!fileMatch)
            return null;
          const streamUrl = fileMatch[1];
          const headers = __spreadProps(__spreadValues({}, getStealthHeaders()), {
            "Referer": url.split("?")[0],
            "Origin": new URL(url).origin,
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": UA
          });
          const streamObj = { url: streamUrl, headers };
          const validation = yield validateStream(streamObj, signal);
          return {
            url: streamUrl,
            quality: (validation == null ? void 0 : validation.quality) || "1080p",
            verified: (_a = validation == null ? void 0 : validation.verified) != null ? _a : true,
            isReal: (_b = validation == null ? void 0 : validation.isReal) != null ? _b : false,
            serverName: "Supervideo",
            headers
          };
        } catch (e) {
          console.error(`[Supervideo] Error: ${e.message}`);
          return null;
        }
      });
    }
    module2.exports = { resolve };
  }
});

// src/utils/resolvers.js
var require_resolvers = __commonJS({
  "src/utils/resolvers.js"(exports2, module2) {
    var { resolve: resolveVoe } = require_voe();
    var { resolve: resolveHlswish } = require_hlswish();
    var { resolve: resolveFilemoon } = require_filemoon();
    var { resolve: resolveVidhide } = require_vidhide();
    var { resolve: resolveDoodstream } = require_doodstream();
    var { resolve: resolveDropcdn } = require_dropcdn();
    var { resolve: resolveGoodstream } = require_goodstream();
    var { resolve: resolveFastream } = require_fastream();
    var { resolve: resolveVimeos } = require_vimeos();
    var { resolve: resolveSupervideo } = require_supervideo();
    var { isMirror } = require_mirrors();
    var { getSessionUA: getSessionUA2 } = require_http();
    var UA = getSessionUA2();
    function getDirectCdnHeaders(url) {
      if (!url)
        return null;
      const { getStealthHeaders } = require_http();
      const s = url.toLowerCase();
      try {
        const domain = new URL(url).hostname;
        const baseOrigin = `https://${domain}`;
        const headers = __spreadProps(__spreadValues({}, getStealthHeaders()), {
          "Referer": baseOrigin,
          "Origin": baseOrigin
        });
        if (isMirror(s, "FILEMOON") || isMirror(s, "VIDHIDE")) {
          headers["X-Requested-With"] = "XMLHttpRequest";
          headers["x-embed-origin"] = domain;
          if (isMirror(s, "FILEMOON")) {
            headers["x-embed-origin"] = "ww3.gnulahd.nu";
            headers["x-embed-parent"] = baseOrigin;
          }
        }
        return headers;
      } catch (e) {
        return { "User-Agent": UA, "referer": url.split("?")[0] };
      }
    }
    function resolveEmbed2(url, signal = null) {
      return __async(this, null, function* () {
        if (!url)
          return null;
        const urlLower = url.toLowerCase();
        if (isMirror(urlLower, "VOE") || url.includes("voe.sx") || url.includes("voe-") || url.includes("voex.sx")) {
          const result = yield resolveVoe(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "STREAMWISH") || url.includes("streamwish") || url.includes("hlswish") || url.includes("filelions")) {
          const result = yield resolveHlswish(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "FILEMOON") || url.includes("filemoon")) {
          const result = yield resolveFilemoon(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "VIDHIDE") || url.includes("vidhide") || url.includes("vidhidepro") || url.includes("vidoza")) {
          const result = yield resolveVidhide(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "DOODSTREAM")) {
          const result = yield resolveDoodstream(url, signal);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "DROPCDN")) {
          const result = yield resolveDropcdn(url);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "GOODSTREAM") || url.includes("goodstream") || url.includes("gs.one")) {
          const result = yield resolveGoodstream(url);
          if (result)
            return result;
        }
        if (isMirror(urlLower, "FASTREAM") || url.includes("fastream") || url.includes("fembed")) {
          const result = yield resolveFastream(url);
          if (result)
            return result;
        }
        if (url.includes("vimeos") || url.includes("vimeo") || url.includes("vms.sh")) {
          const result = yield resolveVimeos(url);
          if (result)
            return result;
        }
        if (url.includes("supervideo")) {
          const result = yield resolveSupervideo(url, signal);
          if (result)
            return result;
        }
        const headers = getDirectCdnHeaders(url);
        return {
          url,
          quality: "SD",
          verified: false,
          headers
        };
      });
    }
    module2.exports = { resolveEmbed: resolveEmbed2, getDirectCdnHeaders };
  }
});

// src/utils/tmdb.js
var require_tmdb = __commonJS({
  "src/utils/tmdb.js"(exports2, module2) {
    var { fetchJson: fetchJson2 } = require_http();
    var TMDB_API_KEY = ["439c478a771f35c05022f9feabcca01c", "d131017ccc6e5462a81c9304d21476de", "1c29a5198ee1854bd5eb45dbe8d17d92"][Math.floor(Math.random() * 3)];
    var titleCache = /* @__PURE__ */ new Map();
    var idCache = /* @__PURE__ */ new Map();
    function getTmdbTitle(tmdbId, mediaType, retries = 2) {
      return __async(this, null, function* () {
        var _a, _b, _c, _d;
        const cacheKey = `${mediaType}_${tmdbId}`;
        if (titleCache.has(cacheKey))
          return titleCache.get(cacheKey);
        if (retries < 2)
          yield new Promise((r) => setTimeout(r, 1e3));
        const isImdb = tmdbId && tmdbId.startsWith("tt");
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          const fetchUrl = isImdb ? `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id` : `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-MX`;
          const data = yield fetchJson2(fetchUrl);
          const title = isImdb ? ((_b = (_a = data[type + "_results"]) == null ? void 0 : _a[0]) == null ? void 0 : _b.title) || ((_d = (_c = data[type + "_results"]) == null ? void 0 : _c[0]) == null ? void 0 : _d.name) : data.title || data.name;
          const result = title || null;
          titleCache.set(cacheKey, result);
          return result;
        } catch (e) {
          if (retries > 0)
            return getTmdbTitle(tmdbId, mediaType, retries - 1);
          titleCache.set(cacheKey, null);
          return null;
        }
      });
    }
    function getTmdbInfo2(tmdbId, mediaType, lang, retries = 2) {
      return __async(this, null, function* () {
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=${lang || "es-MX"}`;
          const data = yield fetchJson2(url);
          return {
            title: data.title || data.name,
            originalTitle: data.original_title || data.original_name || null,
            year: (data.release_date || data.first_air_date || "").split("-")[0],
            genres: (data.genres || []).map((g) => g.id),
            originCountries: data.origin_country || (data.production_countries || []).map((c) => c.iso_3166_1) || []
          };
        } catch (e) {
          if (retries > 0) {
            yield new Promise((r) => setTimeout(r, 1e3));
            return getTmdbInfo2(tmdbId, mediaType, lang, retries - 1);
          }
          return null;
        }
      });
    }
    function getCorrectImdbId(tmdbId, mediaType) {
      return __async(this, null, function* () {
        if (!tmdbId)
          return { imdbId: null, title: "" };
        const cacheKey = `${mediaType}_${tmdbId}`;
        if (idCache.has(cacheKey))
          return idCache.get(cacheKey);
        if (tmdbId.startsWith("tt")) {
          const res = { imdbId: tmdbId, title: "Contenido", offset: 0, fromMapping: false };
          idCache.set(cacheKey, res);
          return res;
        }
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          const idUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
          const idRes = yield fetchJson2(idUrl);
          if (!idRes || !idRes.imdb_id) {
            const result2 = { imdbId: null, title: "Contenido", offset: 0, fromMapping: false };
            idCache.set(cacheKey, result2);
            return result2;
          }
          const metaRes = yield getTmdbInfo2(tmdbId, mediaType);
          const result = {
            imdbId: idRes.imdb_id,
            title: (metaRes == null ? void 0 : metaRes.title) || "Contenido",
            year: (metaRes == null ? void 0 : metaRes.year) || null,
            offset: 0,
            fromMapping: false
          };
          idCache.set(cacheKey, result);
          return result;
        } catch (e) {
          const result = { imdbId: null, title: "Contenido", offset: 0, fromMapping: false };
          idCache.set(cacheKey, result);
          return result;
        }
      });
    }
    function getTmdbAliases(tmdbId, mediaType) {
      return __async(this, null, function* () {
        try {
          const titleEs = yield getTmdbTitle(tmdbId, mediaType);
          const titleEn = yield (() => __async(this, null, function* () {
            try {
              const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
              const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
              const data = yield fetchJson2(url);
              return data.title || data.name || null;
            } catch (e) {
              return null;
            }
          }))();
          const aliases = [];
          if (titleEs)
            aliases.push(titleEs);
          if (titleEn && titleEn !== titleEs)
            aliases.push(titleEn);
          try {
            const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
            const altUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/alternative_titles?api_key=${TMDB_API_KEY}`;
            const altData = yield fetchJson2(altUrl);
            const titles = altData.titles || altData.results || [];
            for (const t of titles) {
              const altTitle = t.title || t.name;
              if (altTitle && !aliases.includes(altTitle))
                aliases.push(altTitle);
            }
          } catch (e) {
            console.warn(`[TMDB-Aliases] Alternative titles fetch failed`);
          }
          return aliases;
        } catch (e) {
          return [];
        }
      });
    }
    module2.exports = { getTmdbTitle, getTmdbInfo: getTmdbInfo2, getCorrectImdbId, getTmdbAliases, TMDB_API_KEY };
  }
});

// src/utils/helpers.js
var require_helpers = __commonJS({
  "src/utils/helpers.js"(exports2, module2) {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function padEpisode(episode) {
      return String(episode).padStart(2, "0");
    }
    function isMovie2(mediaType) {
      return mediaType === "movie" || mediaType === "movies";
    }
    function cleanTmdbId(tmdbId) {
      return tmdbId ? tmdbId.toString().split(":")[0] : tmdbId;
    }
    function toDoubleBase64(str) {
      try {
        if (typeof btoa !== "undefined")
          return btoa(str);
      } catch (e) {
      }
      try {
        if (typeof Buffer !== "undefined")
          return Buffer.from(str, "utf-8").toString("base64");
      } catch (e) {
      }
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 128)
          bytes.push(c);
        else if (c < 2048)
          bytes.push(192 | c >> 6, 128 | c & 63);
        else if (c < 55296 || c >= 57344)
          bytes.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
        else {
          i++;
          const cp = 65536 + ((c & 1023) << 10 | str.charCodeAt(i) & 1023);
          bytes.push(240 | cp >> 18, 128 | cp >> 12 & 63, 128 | cp >> 6 & 63, 128 | cp & 63);
        }
      }
      const b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let r = "";
      for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
        if (b1 === void 0)
          r += b64[b0 >> 2] + b64[(b0 & 3) << 4] + "==";
        else if (b2 === void 0)
          r += b64[b0 >> 2] + b64[(b0 & 3) << 4 | b1 >> 4] + b64[(b1 & 15) << 2] + "=";
        else
          r += b64[b0 >> 2] + b64[(b0 & 3) << 4 | b1 >> 4] + b64[(b1 & 15) << 2 | b2 >> 6] + b64[b2 & 63];
      }
      return r;
    }
    function b64decode(str) {
      try {
        if (typeof atob !== "undefined")
          return atob(str);
      } catch (e) {
      }
      try {
        if (typeof Buffer !== "undefined")
          return Buffer.from(str, "base64").toString("utf8");
      } catch (e) {
      }
      try {
        const s = str.replace(/[\s]/g, "");
        if (s.length % 4 !== 0)
          return null;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        const lookup = {};
        for (let i = 0; i < chars.length; i++)
          lookup[chars[i]] = i;
        let r = "";
        for (let i = 0; i < s.length; i += 4) {
          const c0 = lookup[s[i]], c1 = lookup[s[i + 1]], c2 = lookup[s[i + 2]], c3 = lookup[s[i + 3]];
          if (c0 === void 0 || c1 === void 0 || c2 === void 0 || c3 === void 0)
            return null;
          r += String.fromCharCode(c0 << 2 | c1 >> 4);
          if (c2 !== 64) {
            r += String.fromCharCode((c1 & 15) << 4 | c2 >> 2);
            if (c3 !== 64)
              r += String.fromCharCode((c2 & 3) << 6 | c3);
          }
        }
        return r;
      } catch (e) {
        return null;
      }
    }
    module2.exports = { sleep, padEpisode, isMovie: isMovie2, cleanTmdbId, toDoubleBase64, b64decode };
  }
});

// src/lamovie/extractor.js
var import_http = __toESM(require_http());
var import_engine = __toESM(require_engine());
var import_resolvers = __toESM(require_resolvers());
var import_tmdb = __toESM(require_tmdb());
var import_helpers = __toESM(require_helpers());
var BASE_URL = "https://la.movie";
var API_URL = "https://la.movie/wp-api/v1";
function normalizeQuality(quality) {
  const str = quality.toString().toLowerCase();
  const match = str.match(/(\d+)/);
  if (match)
    return match[1] + "p";
  if (str.indexOf("4k") !== -1 || str.indexOf("uhd") !== -1)
    return "2160p";
  if (str.indexOf("full") !== -1 || str.indexOf("fhd") !== -1)
    return "1080p";
  if (str.indexOf("hd") !== -1)
    return "720p";
  return "SD";
}
function getServerName(url) {
  if (url.indexOf("goodstream") !== -1)
    return "GoodStream";
  if (url.indexOf("hlswish") !== -1 || url.indexOf("streamwish") !== -1 || url.indexOf("strwish") !== -1 || url.indexOf("vibuxer") !== -1)
    return "StreamWish";
  if (url.indexOf("voe.sx") !== -1)
    return "VOE";
  if (url.indexOf("filemoon") !== -1)
    return "Filemoon";
  if (url.indexOf("vimeos.net") !== -1)
    return "Vimeos";
  if (url.indexOf("dood") !== -1 || url.indexOf("d0000d") !== -1)
    return "DoodStream";
  return "Online";
}
function buildSlug(title, year) {
  const slug = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return year ? slug + "-" + year : slug;
}
function getTmdbData(tmdbId, mediaType) {
  return __async(this, null, function* () {
    const attempts = [
      { lang: "es-MX", name: "Latino" },
      { lang: "en-US", name: "Ingl\xE9s" }
    ];
    function tryLang(lang, name) {
      return __async(this, null, function* () {
        const info = yield (0, import_tmdb.getTmdbInfo)(tmdbId, mediaType, lang);
        if (!info)
          throw new Error("No info");
        const title = info.title;
        if (lang === "es-MX" && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(title)) {
          throw new Error("CJK in Spanish");
        }
        console.log(`[LaMovie] TMDB (${name}): "${title}"${info.originalTitle && info.originalTitle !== title ? ` | Original: "${info.originalTitle}"` : ""}`);
        return { title, originalTitle: info.originalTitle, year: info.year, genres: info.genres, originCountries: info.originCountries };
      });
    }
    try {
      return yield tryLang(attempts[0].lang, attempts[0].name);
    } catch (e) {
      console.log(`[LaMovie] Error TMDB Latino: ${e.message}`);
      return yield tryLang(attempts[1].lang, attempts[1].name);
    }
  });
}
function extractIdFromHtml(html) {
  const match = html.match(/rel=['"]shortlink['"]\s+href=['"][^'"]*\?p=(\d+)['"]/);
  return match ? match[1] : null;
}
function getIdBySlug(category, slug) {
  return __async(this, null, function* () {
    const url = BASE_URL + "/" + category + "/" + slug + "/";
    try {
      const html = yield (0, import_http.fetchHtml)(url, { headers: { "Accept": "text/html" } });
      const id = extractIdFromHtml(html);
      if (id) {
        console.log(`[LaMovie] \u2713 Slug directo: /${category}/${slug} \u2192 id:${id}`);
        return { id };
      }
      return null;
    } catch (e) {
      return null;
    }
  });
}
function findBySlug(tmdbInfo, mediaType) {
  return __async(this, null, function* () {
    const { title, originalTitle, year, genres, originCountries } = tmdbInfo;
    const isMovieLoc = (0, import_helpers.isMovie)(mediaType);
    const GENRE_ANIMATION = 16;
    const ANIME_COUNTRIES = ["JP", "CN", "KR"];
    let categories;
    if (isMovieLoc) {
      categories = ["peliculas"];
    } else {
      const isAnimation = (genres || []).includes(GENRE_ANIMATION);
      if (!isAnimation) {
        categories = ["series"];
      } else {
        const isAnimeCountry = (originCountries || []).some((c) => ANIME_COUNTRIES.includes(c));
        categories = isAnimeCountry ? ["animes"] : ["animes", "series"];
      }
    }
    const slugs = [];
    if (title)
      slugs.push(buildSlug(title, year));
    if (originalTitle && originalTitle !== title)
      slugs.push(buildSlug(originalTitle, year));
    function trySlug(slug, cats) {
      return __async(this, null, function* () {
        if (cats.length === 1) {
          return yield getIdBySlug(cats[0], slug);
        }
        const results = yield Promise.all(cats.map((cat) => getIdBySlug(cat, slug).catch(() => null)));
        for (const r of results) {
          if (r)
            return r;
        }
        return null;
      });
    }
    function tryAllSlugs(idx) {
      return __async(this, null, function* () {
        if (idx >= slugs.length)
          return null;
        const result = yield trySlug(slugs[idx], categories);
        if (result)
          return result;
        return yield tryAllSlugs(idx + 1);
      });
    }
    return yield tryAllSlugs(0);
  });
}
function getEpisodeId(seriesId, seasonNum, episodeNum) {
  return __async(this, null, function* () {
    const url = API_URL + "/single/episodes/list?_id=" + seriesId + "&season=" + seasonNum + "&page=1&postsPerPage=50";
    try {
      const data = yield (0, import_http.fetchJson)(url);
      if (!data || !data.data || !data.data.posts)
        return null;
      const posts = data.data.posts;
      for (const e of posts) {
        if (String(e.season_number) === String(seasonNum) && String(e.episode_number) === String(episodeNum)) {
          console.log(`[LaMovie] Episodio S${seasonNum}E${episodeNum} id:${e._id}`);
          return String(e._id);
        }
      }
      console.log(`[LaMovie] Episodio S${seasonNum}E${episodeNum} no encontrado`);
      return null;
    } catch (err) {
      console.log(`[LaMovie] Error episodios: ${err.message}`);
      return null;
    }
  });
}
function processEmbed(embed) {
  return __async(this, null, function* () {
    const resolved = yield (0, import_resolvers.resolveEmbed)(embed.url);
    if (!resolved || !resolved.url) {
      console.log("[LaMovie] Sin resolver para: " + embed.url);
      return null;
    }
    const quality = normalizeQuality(embed.quality || "1080p");
    const serverName = getServerName(embed.url);
    return {
      name: "LaMovie",
      title: quality + " \xB7 " + serverName,
      url: resolved.url,
      quality,
      headers: resolved.headers || {},
      serverLabel: serverName,
      langLabel: "Latino"
    };
  });
}
function extractStreams(tmdbId, mediaType, season, episode, title) {
  return __async(this, null, function* () {
    if (!tmdbId || !mediaType)
      return [];
    const startTime = Date.now();
    const resolvedType = mediaType === "series" ? "tv" : mediaType || "movie";
    console.log(`[LaMovie] Buscando: TMDB ${tmdbId} (${resolvedType})${season ? ` S${season}E${episode}` : ""}`);
    try {
      const tmdbInfo = yield getTmdbData(tmdbId, resolvedType);
      if (!tmdbInfo)
        return [];
      const found = yield findBySlug(tmdbInfo, resolvedType);
      if (!found) {
        console.log("[LaMovie] No encontrado por slug");
        return [];
      }
      let targetId = found.id;
      if (resolvedType === "tv" && season && episode) {
        const epId = yield getEpisodeId(targetId, season, episode);
        if (!epId) {
          console.log(`[LaMovie] Episodio S${season}E${episode} no encontrado`);
          return [];
        }
        targetId = epId;
      }
      if (!targetId || !targetId.length)
        return [];
      const data = yield (0, import_http.fetchJson)(API_URL + "/player?postId=" + targetId + "&demo=0");
      if (!data || !data.data || !data.data.embeds) {
        console.log("[LaMovie] No hay embeds disponibles");
        return [];
      }
      const embeds = data.data.embeds;
      const results = yield Promise.all(embeds.map(processEmbed));
      const streams = results.filter((r) => r);
      const elapsed = ((Date.now() - startTime) / 1e3).toFixed(2);
      console.log(`[LaMovie] \u2713 ${streams.length} streams en ${elapsed}s`);
      return yield (0, import_engine.finalizeStreams)(streams, "LaMovie", tmdbInfo.title);
    } catch (err) {
      console.log(`[LaMovie] Error: ${err.message}`);
      return [];
    }
  });
}

// src/lamovie/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      return yield extractStreams(tmdbId, mediaType, season, episode);
    } catch (e) {
      console.error(`[LaMovie] Error: ${e.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
