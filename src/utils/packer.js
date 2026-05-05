function unpackPacker(html) {
  const match = html.match(
    /eval\(function\(p,a,c,k,e,d\)\{.*?\}\s*\('([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
  );
  if (!match) return null;
  let [, p, a, c, k] = match;
  a = parseInt(a);
  c = parseInt(c);
  k = k.split("|");
  while (c--) {
    if (k[c]) p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
  }
  return p;
}

module.exports = { unpackPacker };
