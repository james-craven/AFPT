module.exports = {
	globDirectory: './',
	globPatterns: [
		'index.html',
		'style.css',
		'src/pfra/*.mjs',
		'src/ui/*.mjs',
		'pwa.js',
		'sw-audio-cache.js',
		'dev-build-info.json',
		'manifest.webmanifest',
		'icon-*.png',
		'maskable_icon.png',
		'*.webp',
		'standards/af-pfra-2026.json',
		'standards/extracted/tables/*.json',
		'standards/sources/pfra-score-pages/*.webp',
		'standards/sources/ShuttleLevels.webp',
		'standards/sources/a31-crops/dafman-36-2905-2-page1-full.webp',
		'standards/sources/a31-crops/dafman-36-2905-2-page2-full.webp'
	],
	globIgnores: [
		'node_modules/**/*',
		'sw.js',
		'sw.js.map',
		'workbox-*.js',
		'workbox-*.js.map',
		'standards/sources/*.pdf',
		'standards/sources/extracted-text/**/*',
		'standards/sources/a31-crops/a31-*.png',
		'standards/extracted/PFRA-Scoring-Charts.txt',
		'standards/extracted/PFRA-Scoring-Charts.notes.md'
	],
	swDest: 'sw.js',
	inlineWorkboxRuntime: true,
	sourcemap: false,
	cleanupOutdatedCaches: true,
	importScripts: ['sw-audio-cache.js'],
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/,
		/^v$/,
		/^ts$/,
		/^qa$/,
		/^sw$/,
		/^dev-build$/
	],
	maximumFileSizeToCacheInBytes: 20000000,
	clientsClaim: true,
	skipWaiting: false,
	navigateFallback: 'index.html',
	navigateFallbackDenylist: [
		/^\/_/,
		/\/[^/?]+\.[^/]+$/
	],
	runtimeCaching: [
			{
			  urlPattern: ({request}) => {
				const {destination} = request;
			
				return destination === 'image';
			  },
			  handler: 'CacheFirst',
			  options: {
				  cacheName: 'afpt-images-v1',
				  cacheableResponse: {
					statuses: [0, 200]
				  },
				  expiration: {
					maxEntries: 100,
					maxAgeSeconds: 31536000
				  }
			  }
			},
			{
				urlPattern: ({url}) => url.origin === self.location.origin && url.pathname.includes('/standards/'),
				handler: 'StaleWhileRevalidate',
				options: {
					cacheName: 'afpt-standards-v1',
					cacheableResponse: {
						statuses: [0, 200]
					}
				}
			},
			  
	],
};
