const CACHE = 'lattice-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(request)
      const networkFetch = fetch(request).then(response => {
        if (response.ok) cache.put(request, response.clone())
        return response
      })
      // Navigation requests: network-first so fresh lessons always load
      if (request.mode === 'navigate') {
        return networkFetch.catch(() => cached ?? Response.error())
      }
      // Assets: cache-first, update in background
      return cached ?? networkFetch
    })
  )
})
