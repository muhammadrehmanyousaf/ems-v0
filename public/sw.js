/* Wedding Wala — Vendor Portal Phase 2 #8.9 service worker.
 *
 * Strategy:
 *   - Static assets (Next.js `/_next/static/*`, fonts, icons): cache-first,
 *     long-lived. Failed lookups fall through to the network so a fresh
 *     deploy isn't masked by a stale cache.
 *   - API requests (`/api/*`): network-first with a 4s timeout, then
 *     fall back to cached JSON if available. Mutations (non-GET) bypass
 *     the cache entirely.
 *   - HTML navigations: network-first, fall back to the cached page,
 *     then to `/offline.html` if nothing's available. Day-of vendors
 *     using this on patchy event-tent wifi need to keep moving.
 *   - Push notifications: surface title + body + tag from the payload
 *     so a Web Push event opens the URL the backend sent.
 *
 * Cache versioning: bump CACHE_VERSION to evict all caches on the next
 * SW activation. Keep this in sync with major releases to avoid weeks-
 * old shell HTML loading after a routing change.
 */

const CACHE_VERSION = "ww-v2-2026-05-28";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const PRECACHE_URLS = ["/", "/dashboard", "/dashboard/today", "/offline.html"];

// HTML navigation freshness timeout — short so a stale shell doesn't hang.
const NAV_TIMEOUT_MS = 6000;
// API freshness timeout when we ALREADY have a cached copy (stale-while-
// revalidate): fall back to cache quickly if the network is slow.
const API_STALE_TIMEOUT_MS = 6000;
// API timeout when there is NO cache: wait long enough for a cold Neon
// backend under concurrent dashboard load. The old 4s value aborted valid
// in-flight requests and fabricated a fake "Offline" 503 for online users.
// A genuinely offline fetch still rejects immediately, so this doesn't slow
// the true-offline path.
const API_NO_CACHE_TIMEOUT_MS = 20000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(png|svg|jpg|jpeg|webp|woff2|css|js|ico)$/.test(url.pathname)
  );
}

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

function isNavigation(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept")?.includes("text/html"))
  );
}

async function networkWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 1) Static assets — cache-first.
  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit;
        return fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
          .catch(() => caches.match("/offline.html"));
      }),
    );
    return;
  }

  // 2) API — network-first, but never abort a slow-but-valid request into a
  //    fake "offline" error. If we have a cached copy, race the network
  //    against a short timeout (stale-while-revalidate). If we DON'T, wait
  //    out a cold/slow backend — a truly offline fetch still rejects fast.
  if (isApi(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        try {
          const res = await networkWithTimeout(
            request,
            cached ? API_STALE_TIMEOUT_MS : API_NO_CACHE_TIMEOUT_MS,
          );
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(API_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        } catch (e) {
          // Network genuinely failed (offline) or exceeded the timeout.
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              success: false,
              message: "Offline — no cached response available",
              data: null,
            }),
            { headers: { "Content-Type": "application/json" }, status: 503 },
          );
        }
      })(),
    );
    return;
  }

  // 3) HTML navigations — network-first, fall back to cached page, then offline.html.
  if (isNavigation(request)) {
    event.respondWith(
      networkWithTimeout(request, NAV_TIMEOUT_MS)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html")),
        ),
    );
    return;
  }

  // 4) Default — try network, no caching policy.
});

// ─── Web Push handling ───────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Wedding Wala", body: event.data.text() };
  }
  const title = payload.title || "Wedding Wala";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/placeholder-logo.png",
    badge: payload.badge || "/placeholder-logo.png",
    tag: payload.tag,
    data: { url: payload.url || "/dashboard" },
    requireInteraction: !!payload.requireInteraction,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          // Reuse an existing tab if already on the target URL.
          if (client.url.endsWith(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
