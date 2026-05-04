async function parallelWithLimit(items, handler, limit = 5) {
  const results = [];

  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchPromises = batch.map(item => {
      return handler(item).catch(() => null);
    });
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null));
  }

  return results;
}

async function resolveWithLimit(items, handler, limit = 5) {
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

async function withTimeout(promise) {
  return await promise;
}

module.exports = { parallelWithLimit, resolveWithLimit, withTimeout };
