const MIRRORS = {
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

module.exports = { MIRRORS, isMirror };