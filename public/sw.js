/* global workbox, importScripts */
/* INCIMMET demo. Workbox pinned; first installation needs its official CDN.
 * Workbox modules are loaded eagerly so the installed worker runs offline.
 * Only same-origin public app assets are cached. Never cache writes or RSC as HTML.
 */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');
workbox.setConfig({ debug: false });
workbox.loadModule('workbox-core');
workbox.loadModule('workbox-routing');
workbox.loadModule('workbox-strategies');
workbox.loadModule('workbox-precaching');
importScripts('/precache-manifest.js');
const entries = self.__INCIMMET_PRECACHE || [];
workbox.core.setCacheNameDetails({ prefix: 'incimmet', suffix: 'pwa-v1' });
workbox.precaching.cleanupOutdatedCaches();
// Requests for React Server Component payloads must never collide with document cache.
workbox.routing.registerRoute(
  ({ request }) =>
    request.headers.get('RSC') === '1' || request.headers.get('Next-Router-Prefetch') === '1',
  new workbox.strategies.NetworkOnly(),
);
workbox.precaching.precacheAndRoute(entries, {
  ignoreURLParametersMatching: [/^origen$/, /^rol$/, /^proyecto$/, /^dpl$/],
});
workbox.routing.registerRoute(
  new workbox.routing.NavigationRoute(async ({ request }) => {
    try {
      return await fetch(request);
    } catch {
      const url = new URL(request.url);
      const local = await workbox.precaching.matchPrecache(url.pathname);
      return local || (await workbox.precaching.matchPrecache('/offline.html')) || Response.error();
    }
  }),
);
// No automatic skipWaiting: changing an active app version requires user confirmation.
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data?.type === 'STATUS')
    event.waitUntil(
      (async () => {
        const available = await Promise.all(
          entries.map((e) => workbox.precaching.matchPrecache(e.url)),
        );
        event.ports[0]?.postMessage({
          ready: entries.length > 3 && available.every(Boolean),
          assets: available.filter(Boolean).length,
        });
      })(),
    );
});
