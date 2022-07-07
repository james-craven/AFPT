module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{html,png,webmanifest,js,m4a,mp3,ogg,css,mjs,webp}'
	],
	swDest: 'sw2.js',
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
			
				return destination === 'video' || destination === 'audio'
			  },
			  handler: 'CacheFirst',
			  options: {
				  rangeRequests: true
			  }
			},
			{
				urlPattern: '**/*.{html,png,webmanifest,js,css,mjs,webp}',
				handler: 'StaleWhileRevalidate',
			},
			  
	],
};