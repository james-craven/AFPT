const staticCacheName = 'v1';

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open(staticCacheName);
  await cache.put(request, response);
};

// const enableNavigationPreload = async () => {
//   if (self.registration.navigationPreload) {
//     // Enable navigation preloads!
//     await self.registration.navigationPreload.enable();
//   }
// };

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticCacheName)
        .map(key => caches.delete(key)))
    })
  )
  // event.waitUntil(enableNavigationPreload());
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
      "shuttle.ogg",
      "manifest.webmanifest",
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



self.addEventListener('fetch', (event) => {
  // Check if this is a navigation request
  if (event.request.mode === 'navigate') {
    //Check if it's a range request (video and audio).
    if (event.request.headers.get('range')) {
      var pos =
      Number(/^bytes\=(\d+)\-$/g.exec(event.request.headers.get('range'))[1]);
      console.log('Range request for', event.request.url,
        ', starting position:', pos);
      event.respondWith(
        caches.open(CURRENT_CACHES.prefetch)
        .then(function(cache) {
          return cache.match(event.request.url);
        }).then(function(res) {
          if (!res) {
            return fetch(event.request)
            .then(res => {
              return res.arrayBuffer();
            });
          }
          return res.arrayBuffer();
        }).then(function(ab) {
          return new Response(
            ab.slice(pos),
            {
              status: 206,
              statusText: 'Partial Content',
              headers: [
                // ['Content-Type', 'video/webm'],
                ['Content-Range', 'bytes ' + pos + '-' +
                  (ab.byteLength - 1) + '/' + ab.byteLength]]
            });
        }));
        //Not a range request
    } else {

    // Open the cache
      event.respondWith(caches.open(staticCacheName).then((cache) => {
        // Go to the network first
        return fetch(event.request.url).then((fetchedResponse) => {
          cache.put(event.request, fetchedResponse.clone());
          return fetchedResponse;
        }).catch(() => {
          // If the network is unavailable, get
          return cache.match(event.request.url);
        });
      }));
    }
  } else {
    return;
  }
});
