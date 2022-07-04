importScripts('/third_party/workbox/workbox-v6.5.3/workbox-sw.js');

workbox.setConfig({
  modulePathPrefix: '/third_party/workbox/workbox-v6.5.3/',
});

const {registerRoute} = workbox.routing;
const {CacheFirst} = workbox.strategies;
const {CacheableResponse} = workbox.cacheableResponse;
const {RangeRequests} = workbox.rangeRequests;

const staticCacheName = 'v1';



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
      "/",
      "index.html",
      "style.css",
      "tm.js",
      "home-screen-icon.png",
      "plus.png",
      "arrow.png",
      "sketch.js",
      "pushups.png",
      "situps.png",
      "running.png",
      "manifest.webmanifest",
      "shuttle.mp3",
      "./web formatted jpgs/shuttleScores.webp",
      "./web formatted jpgs/walkChart.webp",
      "./web formatted jpgs/walkAltitudeAdjust.webp",
      "./web formatted jpgs/runAltitudeAdjust.webp",
      "./web formatted jpgs/male_lessthan25_Strength_Abs.webp",
      "./web formatted jpgs/male_lessthan25_Run_Shuttle.webp",
      "./web formatted jpgs/male_25-29_Strength_Abs.webp",
      "./web formatted jpgs/male_25-29_cardio.webp",
      "./web formatted jpgs/male_30-34_Strength_Abs.webp",
      "./web formatted jpgs/male_30-34_cardio.webp",
      "./web formatted jpgs/male_35-39_Strength_Abs.webp",
      "./web formatted jpgs/male_35-39_cardio.webp",
      "./web formatted jpgs/male_40-44_Strength_Abs.webp",
      "./web formatted jpgs/male_40-44_Run_Shuttle.webp",
      "./web formatted jpgs/male_45-49_Strength_Abs.webp",
      "./web formatted jpgs/male_45-49_cardio.webp",
      "./web formatted jpgs/male_50-54_Strength_Abs.webp",
      "./web formatted jpgs/male_50-54_cardio.webp",
      "./web formatted jpgs/male_55-59_Strength_Abs.webp",
      "./web formatted jpgs/male_55-59_cardio.webp",
      "./web formatted jpgs/male_over60_Strength_Abs.webp",
      "./web formatted jpgs/male_over60_cardio.webp",
      "./web formatted jpgs/female_lessthan25_Strength_Abs.webp",
      "./web formatted jpgs/female_lessthan25_cardio.webp",
      "./web formatted jpgs/female_25-29_Strength_Abs.webp",
      "./web formatted jpgs/female_25-29_cardio.webp",
      "./web formatted jpgs/female_30-34_Strength_Abs.webp",
      "./web formatted jpgs/female_30-34_cardio.webp",
      "./web formatted jpgs/female_35-39_Strength_Abs.webp",
      "./web formatted jpgs/female_35-39_cardio.webp",
      "./web formatted jpgs/female_40-44_Strength_Abs.webp",
      "./web formatted jpgs/female_40-44_cardio.webp",
      "./web formatted jpgs/female_45-49_Strength_Abs.webp",
      "./web formatted jpgs/female_45-49_cardio.webp",
      "./web formatted jpgs/female_50-54_Strength_Abs.webp",
      "./web formatted jpgs/female_50-54_cardio.webp",
      "./web formatted jpgs/female_55-59_Strength_Abs.webp",
      "./web formatted jpgs/female_55-59_cardio.webp",
      "./web formatted jpgs/female_over60_Strength_Abs.webp",
      "./web formatted jpgs/female_over60_cardio.webp"
    ])
  );
});


// registerRoute(
//   ({request}) => {
//     const {destination} = request;

//     return destination === 'video' || destination === 'audio'
//   },
//   new CacheFirst({
//     cacheName: staticCacheName,
//     plugins: [
//       new workbox.cacheableResponse.CacheableResponsePlugin({
//         statuses: [200]
//       }),
//       new workbox.rangeRequests.RangeRequestsPlugin(),
//     ],
//   }),
// );


self.addEventListener('fetch', (event) => {
  // Check if this is a navigation request
  if (event.request.mode === 'navigate') {
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
          if (event.request.headers.has('range')) {
            console.log("Cached response had a header with range");
            cachedResponse = await cachedResponse.blob().then(data => {
              // Get start position from Range request header.
              const pos = Number(/^bytes\=(\d+)\-/g.exec(request.headers.get('range'))[1]);
              const options = {
                status: 206,
                statusText: 'Partial Content',
                headers: response.headers
              }
              const slicedResponse = new Response(data.slice(pos), options);
              slicedResponse.setHeaders('Content-Range', 'bytes ' + pos + '-' +
                  (data.size - 1) + '/' + data.size);
              slicedResponse.setHeaders('X-From-Cache', 'true');
              console.log("returning sliced response")
              return slicedResponse;
            })
          }
          console.log("request didnt have header range. returning regular response");
          return cachedResponse;
        }
        else {
          const response = await event.preloadResponse;
          if (response) return response;
        }
      });
    }));
  } else {
    return "An error was thrown";
  }
});