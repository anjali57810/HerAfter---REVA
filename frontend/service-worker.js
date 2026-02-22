// Self-uninstalling service worker: clear all caches and unregister.
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Clear any remaining caches
			const keys = await caches.keys();
			await Promise.all(keys.map(k => caches.delete(k)));
			// Unregister this service worker so the browser falls back to network
			try { await self.registration.unregister(); } catch (e) { /* ignore */ }
			await self.clients.claim();
		})()
	);
});

// Fallback fetch handler: always try network first
self.addEventListener('fetch', (event) => {
	event.respondWith(
		fetch(event.request).catch(() => caches.match(event.request))
	);
});

// Message handler to allow page to request unregister
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'UNREGISTER_SW') {
		self.registration.unregister();
	}
});
