module.exports = {
	globDirectory: './',
	globPatterns: [
		'index.html',
		'style.css',
		'src/pfra/*.mjs',
		'src/ui/*.mjs',
		'pwa.js',
		'dev-build-info.json',
		'manifest.webmanifest',
		'icon-*.png',
		'maskable_icon.png',
		'arrow.png',
		'pushups.png',
		'running.png',
		'situps.png',
		'shuttle.mp3',
		'standards/af-pfra-2026.json',
		'standards/extracted/tables/*.json',
		'standards/sources/pfra-score-pages/*.jpg',
		'standards/sources/ShuttleLevels.jpeg',
		'standards/sources/a31-crops/dafman-36-2905-2-page1-full.png',
		'standards/sources/a31-crops/dafman-36-2905-2-page2-full.png'
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
			
				return destination === 'video' || destination === 'audio' || destination === 'image'
			  },
			  handler: 'CacheFirst',
			  options: {
				  cacheName: 'afpt-media-v1',
				  rangeRequests: true,
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
