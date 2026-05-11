const CACHE_KEY = "__finovaMarketSessionCache";

function cacheStore() {
  if (!globalThis[CACHE_KEY]) {
    globalThis[CACHE_KEY] = new Map();
  }
  return globalThis[CACHE_KEY];
}

export function getCachedMarketSnapshot(userId) {
  if (!userId) return null;
  return cacheStore().get(userId) || null;
}

export function setCachedMarketSnapshot(userId, snapshot) {
  if (!userId || !snapshot) return snapshot;
  cacheStore().set(userId, snapshot);
  return snapshot;
}

export function invalidateCachedMarketSnapshot(userId) {
  if (!userId) return;
  cacheStore().delete(userId);
}
