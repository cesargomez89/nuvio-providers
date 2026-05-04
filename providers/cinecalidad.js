/**
 * cinecalidad - Built from src/cinecalidad/
 * Generated: 2026-05-04T02:20:15.986Z
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

// src/utils/ua.js
var require_ua = __commonJS({
  "src/utils/ua.js"(exports2, module2) {
    var UA_POOL = [
      "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ];
    function getRandomUA() {
      const index = Math.floor(Math.random() * UA_POOL.length);
      return UA_POOL[index];
    }
    module2.exports = { getRandomUA, UA_POOL };
  }
});

// src/utils/http.js
var require_http = __commonJS({
  "src/utils/http.js"(exports2, module2) {
    var { getRandomUA } = require_ua();
    var DEFAULT_CHROME_UA = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    var sessionUA = null;
    function setSessionUA(ua) {
      sessionUA = ua;
    }
    function getSessionUA() {
      return sessionUA || DEFAULT_CHROME_UA;
    }
    function getStealthHeaders() {
      return {
        "User-Agent": getSessionUA(),
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
    var DEFAULT_UA = getSessionUA();
    var MOBILE_UA = getSessionUA();
    function request2(_0) {
      return __async(this, arguments, function* (url, options = {}) {
        const opt = options || {};
        const currentUA = opt.headers && opt.headers["User-Agent"] ? opt.headers["User-Agent"] : getSessionUA();
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
        const res = yield request2(url, options);
        return yield res.text();
      });
    }
    function fetchJson(url, options) {
      return __async(this, null, function* () {
        const res = yield request2(url, options);
        return yield res.json();
      });
    }
    module2.exports = {
      request: request2,
      fetchHtml: fetchHtml2,
      fetchJson,
      getSessionUA,
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
    var { getSessionUA } = require_http();
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
              "User-Agent": getSessionUA()
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
      "VidHide": -5
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
        "vidhidepro",
        "vidhidevip",
        "masukestin",
        "vidoza",
        "supervideo"
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
        "voex.sx",
        "marissashare",
        "cloudwindow",
        "marissasharecareer"
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
    var { getSessionUA } = require_http();
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
          const currentUA = getSessionUA();
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
    var { getSessionUA } = require_http();
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
          const UA = getSessionUA();
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
    var { getSessionUA } = require_http();
    var UA_CHROME = getSessionUA();
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
    var { getSessionUA, getStealthHeaders } = require_http();
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
          const currentUA = getSessionUA();
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

// src/resolvers/quality.js
var require_quality = __commonJS({
  "src/resolvers/quality.js"(exports2, module2) {
    var { request: request2, getSessionUA } = require_http();
    function detectQuality(_0) {
      return __async(this, arguments, function* (url, headers = {}) {
        try {
          if (!url || !url.includes(".m3u8"))
            return "1080p";
          const res = yield request2(url, {
            timeout: 5e3,
            headers: __spreadValues({
              "User-Agent": getSessionUA()
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
    var { getSessionUA } = require_http();
    function resolve(embedUrl) {
      return __async(this, null, function* () {
        try {
          const UA = getSessionUA();
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
    function unpackPacker(data) {
      const match = data.match(/eval\(function\(p,a,c,k,e,d\)\{.*?\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)\)\)/);
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
    var { fetchHtml: fetchHtml2, fetchJson, getSessionUA } = require_http();
    function resolve(embedUrl) {
      return __async(this, null, function* () {
        const UA = getSessionUA();
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
              var config = yield fetchJson("https://player.vimeo.com/video/" + vimeoId + "/config", {
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

// src/utils/resolvers.js
var require_resolvers = __commonJS({
  "src/utils/resolvers.js"(exports2, module2) {
    var { resolve: resolveVoe } = require_voe();
    var { resolve: resolveHlswish } = require_hlswish();
    var { resolve: resolveFilemoon } = require_filemoon();
    var { resolve: resolveVidhide } = require_vidhide();
    var { resolve: resolveGoodstream } = require_goodstream();
    var { resolve: resolveFastream } = require_fastream();
    var { resolve: resolveVimeos } = require_vimeos();
    var { isMirror } = require_mirrors();
    var { getSessionUA } = require_http();
    var UA = getSessionUA();
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
        if (isMirror(urlLower, "VOE") || url.includes("voe.sx") || url.includes("voe-") || url.includes("voex.sx"))
          return yield resolveVoe(url, signal);
        if (isMirror(urlLower, "STREAMWISH") || url.includes("streamwish") || url.includes("hlswish") || url.includes("filelions"))
          return yield resolveHlswish(url, signal);
        if (isMirror(urlLower, "FILEMOON") || url.includes("filemoon"))
          return yield resolveFilemoon(url, signal);
        if (isMirror(urlLower, "VIDHIDE") || url.includes("vidhide") || url.includes("vidhidepro") || url.includes("vidoza"))
          return yield resolveVidhide(url, signal);
        if (url.includes("goodstream") || url.includes("gs.one"))
          return yield resolveGoodstream(url);
        if (url.includes("fastream") || url.includes("fembed"))
          return yield resolveFastream(url);
        if (url.includes("vimeos") || url.includes("vimeo") || url.includes("vms.sh"))
          return yield resolveVimeos(url);
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

// src/cinecalidad/tmdb.js
var require_tmdb = __commonJS({
  "src/cinecalidad/tmdb.js"(exports2, module2) {
    var axios = require("axios");
    var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
    var titleCache = /* @__PURE__ */ new Map();
    function getTmdbTitle2(tmdbId, mediaType, language = "en-US", retries = 2) {
      return __async(this, null, function* () {
        if (!tmdbId)
          return null;
        const cleanId = tmdbId.toString().split(":")[0];
        const cacheKey = `${cleanId}_${mediaType}_${language}`;
        if (titleCache.has(cacheKey))
          return titleCache.get(cacheKey);
        try {
          const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
          let url;
          if (cleanId.startsWith("tt")) {
            url = `https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=${language}`;
            const { data } = yield axios.get(url, { timeout: 6e3 });
            const result = type === "movie" ? data.movie_results && data.movie_results[0] : data.tv_results && data.tv_results[0] || data.movie_results && data.movie_results[0];
            const title = result ? result.name || result.title : null;
            if (title)
              titleCache.set(cacheKey, title);
            return title;
          } else {
            url = `https://api.themoviedb.org/3/${type}/${cleanId}?api_key=${TMDB_API_KEY}&language=${language}`;
            const { data } = yield axios.get(url, { timeout: 6e3 });
            const title = data.name || data.title || null;
            if (title)
              titleCache.set(cacheKey, title);
            return title;
          }
        } catch (e) {
          if (retries > 0) {
            console.log(`[TMDB-Rescue] Retrying ${tmdbId} (${retries} left)...`);
            yield new Promise((r) => setTimeout(r, 1e3));
            return getTmdbTitle2(tmdbId, mediaType, retries - 1);
          }
          console.log(`[TMDB-Rescue] Failed to fetch title for ${tmdbId}: ${e.message}`);
          return null;
        }
      });
    }
    function getTmdbInfo(tmdbId, mediaType) {
      return __async(this, null, function* () {
        if (!tmdbId)
          return null;
        const cleanId = tmdbId.toString().split(":")[0];
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        try {
          let url;
          let result;
          if (cleanId.startsWith("tt")) {
            url = `https://api.themoviedb.org/3/find/${cleanId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
            const { data } = yield axios.get(url, { timeout: 6e3 });
            result = type === "movie" ? data.movie_results && data.movie_results[0] : data.tv_results && data.tv_results[0] || data.movie_results && data.movie_results[0];
          } else {
            url = `https://api.themoviedb.org/3/${type}/${cleanId}?api_key=${TMDB_API_KEY}`;
            const { data } = yield axios.get(url, { timeout: 6e3 });
            result = data;
          }
          if (result) {
            const title = result.name || result.title;
            const date = result.release_date || result.first_air_date || "";
            const year = date.split("-")[0];
            return { title, year };
          }
          return null;
        } catch (e) {
          return null;
        }
      });
    }
    function getTmdbAliases2(tmdbId, mediaType) {
      return __async(this, null, function* () {
        if (!tmdbId)
          return [];
        const cleanId = tmdbId.toString().split(":")[0];
        const type = mediaType === "movie" || mediaType === "movies" ? "movie" : "tv";
        const titles = /* @__PURE__ */ new Set();
        try {
          const [enTitle, esTitle] = yield Promise.all([
            getTmdbTitle2(cleanId, type, "en-US"),
            getTmdbTitle2(cleanId, type, "es-MX")
          ]);
          if (enTitle)
            titles.add(enTitle);
          if (esTitle)
            titles.add(esTitle);
          const altUrl = `https://api.themoviedb.org/3/${type}/${cleanId}/alternative_titles?api_key=${TMDB_API_KEY}`;
          const { data } = yield axios.get(altUrl, { timeout: 5e3 });
          const altResults = data.titles || data.results || [];
          altResults.forEach((item) => {
            if (item.title)
              titles.add(item.title);
          });
          return Array.from(titles);
        } catch (e) {
          console.warn(`[TMDB-Aliases] Failed for ${tmdbId}: ${e.message}`);
          return Array.from(titles);
        }
      });
    }
    module2.exports = { getTmdbTitle: getTmdbTitle2, getTmdbInfo, getTmdbAliases: getTmdbAliases2 };
  }
});

// src/cinecalidad/extractor.js
var import_http = __toESM(require_http());
var import_engine = __toESM(require_engine());
var import_resolvers = __toESM(require_resolvers());
var import_tmdb = __toESM(require_tmdb());
var BASE_URL = "https://www.cinecalidad.vg";
var UA3 = "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
var HEADERS = {
  "User-Agent": UA3,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-MX,es;q=0.9",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Referer": `${BASE_URL}/`
};
function getServerName(url) {
  if (url.includes("goodstream"))
    return "GoodStream";
  if (url.includes("hlswish") || url.includes("streamwish") || url.includes("strwish"))
    return "StreamWish";
  if (url.includes("voe.sx"))
    return "VOE";
  if (url.includes("filemoon"))
    return "Filemoon";
  if (url.includes("vimeos"))
    return "Vimeos";
  return "Online";
}
function b64decode(str) {
  try {
    if (typeof atob !== "undefined")
      return atob(str);
    return Buffer.from(str, "base64").toString("utf8");
  } catch (e) {
    return null;
  }
}
function buildSlug(title) {
  return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function getMovieUrl(slug, expectedYear) {
  return __async(this, null, function* () {
    const slugsToTry = [slug, `${slug}-2`, `${slug}-3`];
    const slugResults = yield Promise.all(
      slugsToTry.map((s) => __async(this, null, function* () {
        const url = `${BASE_URL}/pelicula/${s}/`;
        try {
          const res = yield (0, import_http.request)(url, { headers: HEADERS });
          if (!res || !res.ok)
            return null;
          const html = yield res.text();
          if (html.includes("404 Not Found") || !html.includes('id="btn_enlace"'))
            return null;
          const yearMatch = html.match(/<h1[^>]*>[^<]*\((\d{4})\)[^<]*<\/h1>/);
          const year = yearMatch ? yearMatch[1] : null;
          if (!year || !expectedYear || year === expectedYear) {
            console.log(`[CineCalidad] \u2713 Encontrado v\xEDa slug: /pelicula/${s}/ (${year || "?"})`);
            return url;
          }
        } catch (e) {
        }
        return null;
      }))
    );
    return slugResults.find((r) => r !== null);
  });
}
function searchResults(title) {
  return __async(this, null, function* () {
    try {
      const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(title)}`;
      const res = yield (0, import_http.request)(searchUrl, { headers: HEADERS });
      if (!res || !res.ok)
        return [];
      const html = yield res.text();
      const results = [];
      const regex = /<article[^>]*>[\s\S]*?<a[^>]+href="([^"]+pelicula\/[^"]+)"/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (!results.includes(match[1]))
          results.push(match[1]);
      }
      return results;
    } catch (e) {
      console.log(`[CineCalidad] Error en b\xFAsqueda: ${e.message}`);
      return [];
    }
  });
}
function isKnownEmbed(url) {
  return true;
}
function getEmbedUrls(movieUrl) {
  return __async(this, null, function* () {
    try {
      const data = yield (0, import_http.fetchHtml)(movieUrl, { headers: HEADERS });
      const embedLinks = [];
      const regex = /data-src="([A-Za-z0-9+/=]{20,})"/g;
      let match;
      while ((match = regex.exec(data)) !== null)
        embedLinks.push(match[1]);
      const decodedUrls = [...new Set(
        embedLinks.map((b64) => b64decode(b64)).filter((url) => url && url.startsWith("http"))
      )];
      const directEmbeds = decodedUrls.filter(isKnownEmbed);
      const intermediateUrls = decodedUrls.filter((u) => !isKnownEmbed(u));
      const embedUrls = new Set(directEmbeds);
      if (intermediateUrls.length > 0) {
        yield Promise.allSettled(intermediateUrls.map((decoded) => __async(this, null, function* () {
          try {
            const midData = yield (0, import_http.fetchHtml)(decoded, { headers: HEADERS });
            let finalUrl = "";
            const btnMatch = midData.match(/id="btn_enlace"[^>]*>[\s\S]*?href="([^"]+)"/);
            if (btnMatch)
              finalUrl = btnMatch[1];
            if (!finalUrl) {
              const iframeMatch = midData.match(/<iframe[^>]+src="([^"]+)"/);
              if (iframeMatch)
                finalUrl = iframeMatch[1];
            }
            if (!finalUrl && decoded.includes("/e/"))
              finalUrl = decoded;
            if (finalUrl && finalUrl.startsWith("http"))
              embedUrls.add(finalUrl);
          } catch (e) {
          }
        })));
      }
      return [...embedUrls];
    } catch (e) {
      console.log(`[CineCalidad] Error obteniendo embeds: ${e.message}`);
      return [];
    }
  });
}
function processEmbed(embedUrl) {
  return __async(this, null, function* () {
    try {
      const result = yield (0, import_resolvers.resolveEmbed)(embedUrl);
      if (!result || !result.url)
        return null;
      return {
        langLabel: "Latino",
        serverLabel: getServerName(embedUrl),
        url: result.url,
        quality: result.quality,
        siteQuality: null,
        headers: result.headers || {}
      };
    } catch (e) {
      return null;
    }
  });
}
function extractStreams(tmdbId, mediaType, season, episode, title) {
  return __async(this, null, function* () {
    if (!tmdbId || !mediaType || mediaType === "tv")
      return [];
    const startTime = Date.now();
    console.log(`[CineCalidad] Buscando: TMDB ${tmdbId} (${mediaType})`);
    try {
      let mediaTitle = title;
      if (!mediaTitle && tmdbId) {
        mediaTitle = yield (0, import_tmdb.getTmdbTitle)(tmdbId, mediaType);
      }
      if (!mediaTitle)
        return [];
      const slug = buildSlug(mediaTitle);
      let selectedUrl = yield getMovieUrl(slug, null);
      if (!selectedUrl) {
        console.log(`[CineCalidad] Slug directo fall\xF3, intentando b\xFAsqueda interna para: ${mediaTitle}`);
        const foundResults = yield searchResults(mediaTitle);
        if (foundResults.length > 0) {
          selectedUrl = foundResults[0];
          console.log(`[CineCalidad] \u2713 Encontrado v\xEDa b\xFAsqueda: ${selectedUrl}`);
        }
      }
      if (!selectedUrl && tmdbId) {
        console.log(`[CineCalidad] Iniciando rescate por Alias en paralelo...`);
        const aliases = yield (0, import_tmdb.getTmdbAliases)(tmdbId, mediaType);
        const filteredAliases = [...new Set(aliases.filter((alias) => {
          if (!alias || alias === mediaTitle)
            return false;
          return /^[a-zA-Z0-9\s\-\:\.\,¡!¿?áéíóúÁÉÍÓÚñÑ]+$/.test(alias);
        }))].slice(0, 5);
        if (filteredAliases.length > 0) {
          const aliasPromises = filteredAliases.map((alias) => __async(this, null, function* () {
            const aliasSlug = buildSlug(alias);
            const urlBySlug = yield getMovieUrl(aliasSlug, null);
            if (urlBySlug)
              return urlBySlug;
            const aliasResults = yield searchResults(alias);
            return aliasResults.length > 0 ? aliasResults[0] : null;
          }));
          const parallelResults = yield Promise.all(aliasPromises);
          selectedUrl = parallelResults.find((url) => url !== null);
          if (selectedUrl) {
            console.log(`[CineCalidad] \u2713 Encontrado v\xEDa rescate paralelo: ${selectedUrl}`);
          }
        }
      }
      if (!selectedUrl) {
        console.log(`[CineCalidad] No se encontr\xF3 la pel\xEDcula tras agotar alias para: ${mediaTitle}`);
        return [];
      }
      const embedUrls = yield getEmbedUrls(selectedUrl);
      if (embedUrls.length === 0)
        return [];
      const uniqueEmbeds = [...new Set(embedUrls)];
      const streams = (yield Promise.allSettled(uniqueEmbeds.map(processEmbed))).filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
      return yield (0, import_engine.finalizeStreams)(streams, "CineCalidad", mediaTitle);
    } catch (e) {
      console.log(`[CineCalidad] Error: ${e.message}`);
      return [];
    }
  });
}

// src/cinecalidad/index.js
function getStreams(tmdbId, mediaType, season, episode, title) {
  return __async(this, null, function* () {
    try {
      console.log(`[CineCalidad] Request: ${mediaType} ${tmdbId}`);
      const streams = yield extractStreams(tmdbId, mediaType, season, episode, title);
      return streams;
    } catch (error) {
      console.error(`[CineCalidad] Error: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
