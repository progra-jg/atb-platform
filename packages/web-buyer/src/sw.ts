/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "atb-api-v1",
    networkTimeoutSeconds: 8,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200, 201, 204] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 300 }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "atb-fonts-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 31536000 }),
    ],
  })
);

registerRoute(
  ({ url }) => /\.(svg|png|jpg|jpeg|gif|webp|avif|ico)(\?.*)?$/i.test(url.pathname),
  new CacheFirst({
    cacheName: "atb-images-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/assets/"),
  new StaleWhileRevalidate({
    cacheName: "atb-assets-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 604800 }),
    ],
  })
);

self.addEventListener("push", (event) => {
  const fallback = { title: "ATB AgriTrace", body: "", tag: "default", url: "/" };
  let data: typeof fallback;
  try {
    data = event.data ? { ...fallback, ...event.data.json() } : fallback;
  } catch {
    data = { ...fallback, body: event.data?.text() ?? "" };
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title,
      {
        body: data.body,
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        tag: data.tag,
        vibrate: [200, 100, 200],
        renotify: true,
        requireInteraction: false,
        data: { url: data.url, tag: data.tag },
      } as NotificationOptions
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const match = clients.find((c) => {
          const cUrl = new URL(c.url);
          const targetUrl = new URL(url, self.location.origin);
          return cUrl.pathname === targetUrl.pathname && !cUrl.hash;
        });
        if (match) return match.focus();
        return self.clients.openWindow(url);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      self.clients.matchAll({ type: "window" }).then((all) => {
        all.forEach((client) => client.navigate(client.url));
      });
    })
  );
});

export type {};
