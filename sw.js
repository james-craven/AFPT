importScripts('./site-assets/third_party/workbox/workbox-v6.5.3/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: './site-assets/third_party/workbox/workbox-v6.5.3/',
});

const {registerRoute} = workbox.routing;
const {CacheFirst} = workbox.strategies;
const {CacheableResponse} = workbox.cacheableResponse;
const {RangeRequests} = workbox.rangeRequests;

const staticCacheName = 'v2';



const addResourcesToCache = async (resources) => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open(staticCacheName);
  await cache.put(request, response);
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Enable navigation preloads!
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticCacheName)
        .map(key => caches.delete(key)))
    })
  )
  event.waitUntil(enableNavigationPreload());
  event.waitUntil(clients.claim());
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    addResourcesToCache([
      "./",
      "./index.html",
      "./site-assets/style.css",
      "./site-assets/tm.js",
      "./site-assets/home-screen-icon.png",
      "./site-assets/plus.png",
      "./site-assets/arrow.png",
      "./site-assets/sketch.js",
      "./site-assets/pushups.png",
      "./site-assets/situps.png",
      "./site-assets/running.png",
      "./site-assets/manifest.webmanifest",
      "./site-assets/shuttle.mp3",
      "./site-assets/web formatted jpgs/shuttleScores.webp",
      "./site-assets/web formatted jpgs/walkChart.webp",
      "./site-assets/web formatted jpgs/walkAltitudeAdjust.webp",
      "./site-assets/web formatted jpgs/runAltitudeAdjust.webp",
      "./site-assets/web formatted jpgs/male_lessthan25_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_lessthan25_Run_Shuttle.webp",
      "./site-assets/web formatted jpgs/male_25-29_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_25-29_cardio.webp",
      "./site-assets/web formatted jpgs/male_30-34_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_30-34_cardio.webp",
      "./site-assets/web formatted jpgs/male_35-39_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_35-39_cardio.webp",
      "./site-assets/web formatted jpgs/male_40-44_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_40-44_Run_Shuttle.webp",
      "./site-assets/web formatted jpgs/male_45-49_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_45-49_cardio.webp",
      "./site-assets/web formatted jpgs/male_50-54_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_50-54_cardio.webp",
      "./site-assets/web formatted jpgs/male_55-59_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_55-59_cardio.webp",
      "./site-assets/web formatted jpgs/male_over60_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/male_over60_cardio.webp",
      "./site-assets/web formatted jpgs/female_lessthan25_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_lessthan25_cardio.webp",
      "./site-assets/web formatted jpgs/female_25-29_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_25-29_cardio.webp",
      "./site-assets/web formatted jpgs/female_30-34_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_30-34_cardio.webp",
      "./site-assets/web formatted jpgs/female_35-39_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_35-39_cardio.webp",
      "./site-assets/web formatted jpgs/female_40-44_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_40-44_cardio.webp",
      "./site-assets/web formatted jpgs/female_45-49_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_45-49_cardio.webp",
      "./site-assets/web formatted jpgs/female_50-54_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_50-54_cardio.webp",
      "./site-assets/web formatted jpgs/female_55-59_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_55-59_cardio.webp",
      "./site-assets/web formatted jpgs/female_over60_Strength_Abs.webp",
      "./site-assets/web formatted jpgs/female_over60_cardio.webp"
    ])
  );
});


registerRoute(
  ({request}) => {
    const {destination} = request;

    return destination === 'video' || destination === 'audio'
  },
  new CacheFirst({
    cacheName: staticCacheName,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200]
      }),
      new workbox.rangeRequests.RangeRequestsPlugin(),
    ],
  }),
);


self.addEventListener('fetch', (event) => {
  // Check if this is a navigation request
    // Open the cache
    event.respondWith(caches.open(staticCacheName).then((cache) => {
      // Go to the network first
      return fetch(event.request.url).then((fetchedResponse) => {
        cache.put(event.request, fetchedResponse.clone());
        console.log("returning network response for: " + event.request.url);
        return fetchedResponse;
      }).catch(async() => {
        console.log("trying Cache");
        //Network unavailable, try cache.
        const cachedResponse = await cache.match(event.request.url);
        if (cachedResponse) {
          console.log("Cache returned response");
          // if (event.request.headers.has('range')) {
          //   console.log("Request had a header with range");
          //   cachedResponseBlob = await cachedResponse.blob().then(data => {
          //     // Get start position from Range request header.
          //     const pos = Number(/^bytes\=(\d+)\-/g.exec(event.request.headers.get('range'))[1]);
          //     const options = {
          //       status: 206,
          //       statusText: 'Partial Content',
          //       headers: cachedResponse.headers()
          //     }
          //     console.log(cachedResponse, cachedResponse.headers())
          //     const slicedResponse = new Response(data.slice(pos), options);
          //     slicedResponse.headers.set('Content-Range', 'bytes ' + pos + '-' +
          //         (data.size - 1) + '/' + data.size);
          //     slicedResponse.headers.set('X-From-Cache', 'true');
          //     console.log("returning sliced response: " + slicedResponse + " | " + slicedResponse.headers())
          //     return slicedResponse;
          //   })
          // }
          console.log("request didnt have header range. returning regular response");
          return cachedResponse;
        }
        else {
          const response = await event.preloadResponse;
          if (response) return response;
        }
      });
    }));
});