(() => {
  const AUDIO_CACHE_NAME = 'afpt-audio-v1';
  const LEGACY_MEDIA_CACHE_NAME = 'afpt-media-v1';
  const CHALLENGE_PATH_RE = /^\/14WS-500\/?$/;
  const CHALLENGE_ENTRY_URL = new URL('14WS-500/index.html', self.registration.scope).href;
  const SHUTTLE_AUDIO_URL = new URL('shuttle.mp3', self.registration.scope).href;

  function parseRange(rangeHeader, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || '');
    if (!match) return null;

    let start = match[1] === '' ? 0 : Number(match[1]);
    let end = match[2] === '' ? size - 1 : Number(match[2]);

    if (match[1] === '' && match[2] !== '') {
      const suffixLength = Number(match[2]);
      start = Math.max(size - suffixLength, 0);
      end = size - 1;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
      return null;
    }

    return { start, end: Math.min(end, size - 1) };
  }

  async function rangeResponse(response, rangeHeader) {
    const buffer = await response.arrayBuffer();
    const range = parseRange(rangeHeader, buffer.byteLength);

    if (!range) {
      return new Response(null, {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: {
          'Content-Range': `bytes */${buffer.byteLength}`,
        },
      });
    }

    const body = buffer.slice(range.start, range.end + 1);
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(body.byteLength));
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${buffer.byteLength}`);

    return new Response(body, {
      status: 206,
      statusText: 'Partial Content',
      headers,
    });
  }

  async function repairChallengeClients() {
    if (!self.clients?.matchAll) return;
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    await Promise.all(clients.map((client) => {
      const url = new URL(client.url);
      if (url.origin !== self.location.origin || !CHALLENGE_PATH_RE.test(url.pathname)) return null;
      return client.navigate(CHALLENGE_ENTRY_URL).catch(() => null);
    }));
  }

  self.addEventListener('activate', (event) => {
    event.waitUntil(Promise.all([
      caches.delete(LEGACY_MEDIA_CACHE_NAME),
      repairChallengeClients(),
    ]));
  });

  self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.href !== SHUTTLE_AUDIO_URL) return;

    event.respondWith((async () => {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const cached = await cache.match(SHUTTLE_AUDIO_URL);

      if (!cached) return fetch(request);

      const rangeHeader = request.headers.get('range');
      return rangeHeader ? rangeResponse(cached, rangeHeader) : cached;
    })());
  });
})();
