const addResourcesToCache = async (resources) => {
  const cache = await caches.open('v1');
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open('v1');
  await cache.put(request, response);
};

// const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
//   // First try to get the resource from the cache
//   const responseFromCache = await caches.match(request);
//   if (responseFromCache) {
//     return responseFromCache;
//   }

//   // Next try to use the preloaded response, if it's there
//   const preloadResponse = await preloadResponsePromise;
//   if (preloadResponse) {
//     console.info('using preload response', preloadResponse);
//     putInCache(request, preloadResponse.clone());
//     return preloadResponse;
//   }

//   // Next try to get the resource from the network
//   try {
//     const responseFromNetwork = await fetch(request);
//     // response may be used only once
//     // we need to save clone to put one copy in cache
//     // and serve second one
//     putInCache(request, responseFromNetwork.clone());
//     return responseFromNetwork;
//   } catch (error) {
//     const fallbackResponse = await caches.match(fallbackUrl);
//     if (fallbackResponse) {
//       return fallbackResponse;
//     }
//     // when even the fallback response is not available,
//     // there is nothing we can do, but we must always
//     // return a Response object
//     return new Response('Network error happened', {
//       status: 408,
//       headers: { 'Content-Type': 'text/plain' },
//     });
//   }
// };

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Enable navigation preloads!
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener('activate', (event) => {
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
    // Open the cache
    event.respondWith(caches.open('v1').then((cache) => {
      // Go to the network first
      return fetch(event.request.url).then((fetchedResponse) => {
        cache.put(event.request, fetchedResponse.clone());
        return fetchedResponse;
      }).catch(() => {
        // If the network is unavailable, get
        return cache.match(event.request.url);
      });
    }));
  } else {
    return;
  }
});
