// Registers the service worker (online only, over https or localhost) and asks the browser to keep students' saved work.
(function () {
  try {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  } catch (e) {}
})();
