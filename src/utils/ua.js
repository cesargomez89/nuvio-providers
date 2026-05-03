const UA_POOL = [
  "Mozilla/5.0 (Linux; Android 13; Chromecast) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
];

function getRandomUA() {
  const index = Math.floor(Math.random() * UA_POOL.length);
  return UA_POOL[index];
}

module.exports = { getRandomUA, UA_POOL };