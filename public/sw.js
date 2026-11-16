// Minimal service worker — just enough for browsers to treat JobTrack as an
// installable app. It doesn't cache anything (every request goes to the
// network as normal); offline support isn't a goal for this demo.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally no-op: let the browser handle every request normally.
});
