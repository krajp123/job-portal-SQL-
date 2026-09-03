const pendingRequests = new Map();

export function dedupeRequest(key, requestFn, ttl = 500) {
  const existing = pendingRequests.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.promise;

  const promise = Promise.resolve().then(requestFn).finally(() => {
    window.setTimeout(() => {
      const current = pendingRequests.get(key);
      if (current?.promise === promise) pendingRequests.delete(key);
    }, ttl);
  });

  pendingRequests.set(key, { promise, expiresAt: Date.now() + ttl });
  return promise;
}
