module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{html,css,js,png,webmanifest,m4a,mp3,ogg,mjs,webp}'
	],
	globIgnores: [
		'sw.js',
		'sw.js.map',
		'workbox-*.js',
		'workbox-*.js.map'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	maximumFileSizeToCacheInBytes: 20000000,
	clientsClaim: true,
	skipWaiting: true,
	runtimeCaching: [
			{
			  urlPattern: ({request}) => {
				const {destination} = request;
			
				return destination === 'video' || destination === 'audio' || destination === 'image'
			  },
			  handler: 'CacheFirst',
			  options: {
				  rangeRequests: true
			  }
			},
			{
				urlPattern: '**/*.{html,webmanifest,js,css,mjs}',
				handler: 'NetworkFirst',
			},
			  
	],
};
