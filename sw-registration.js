(async () => {
    if ("serviceWorker" in navigator) {
        let t = !1;
        const e = await navigator.serviceWorker.register("sw.js", {scope: 'https://afptcalc.com'});
        e.addEventListener("updatefound", () => {
            e.installing &&
                e.installing.addEventListener("statechange", () => {
                    e.waiting && (navigator.serviceWorker.controller ? t || ((t = !0), window.location.reload()) : console.log("Service Worker initialized for the first time: " + e.scope));
                });
        });
    }
})();