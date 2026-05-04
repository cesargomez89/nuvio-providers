const DEFAULT_TIMEOUT = 30000;

async function parallelWithLimit(items, handler, limit = 5, timeout = DEFAULT_TIMEOUT) {
  const results = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchPromises = batch.map(item => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      return Promise.race([
        handler(item, controller.signal).catch(() => null),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]).finally(() => clearTimeout(timeoutId));
    });
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null));
  }

  return results;
}

async function resolveWithLimit(items, handler, limit = 5, totalTimeout = DEFAULT_TIMEOUT) {
  const results = [];

  const promises = items.map(async (item) => {
    return await handler(item);
  });

  const settled = await Promise.allSettled(promises);
  settled.forEach(r => {
    if (r.status === 'fulfilled' && r.value) results.push(r.value);
  });

  return results;
}

async function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { parallelWithLimit, resolveWithLimit, withTimeout, DEFAULT_TIMEOUT };
