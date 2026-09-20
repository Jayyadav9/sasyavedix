import { useEffect, useState } from "react";

/** Live online/offline state of the device. */
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

const PREFIX = "sasyavedix-cache:";

/** Keep the last successful copy of a dataset so it can be read without a connection. */
export function cacheSave(key: string, value: unknown) {
  try {
    window.localStorage.setItem(
      PREFIX + key,
      JSON.stringify({ at: new Date().toISOString(), value }),
    );
  } catch {
    /* storage full or unavailable — cache is best effort */
  }
}

export function cacheRead<T>(key: string): { at: string; value: T } | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as { at: string; value: T }) : null;
  } catch {
    return null;
  }
}

/** Returns live data when available, otherwise the last cached copy. */
export function withCache<T>(key: string, data: T | undefined): { data: T | undefined; cachedAt: string | null } {
  if (typeof window === "undefined") return { data, cachedAt: null };
  if (data !== undefined && data !== null) {
    cacheSave(key, data);
    return { data, cachedAt: null };
  }
  const hit = cacheRead<T>(key);
  return hit ? { data: hit.value, cachedAt: hit.at } : { data: undefined, cachedAt: null };
}
