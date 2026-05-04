async function parallelWithLimit(items, handler, limit = 5, timeout = 10000) {
  const results = [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.allSettled(
      batch.map(item => handler(item))
    );
    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null));
  }

  clearTimeout(timeoutId);
  return results;
}

async function resolveWithLimit(items, handler, limit = 5, totalTimeout = 15000) {
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

module.exports = { parallelWithLimit, resolveWithLimit };