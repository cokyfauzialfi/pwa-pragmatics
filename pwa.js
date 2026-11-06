// Registers the service worker (online only, over https or localhost), asks the browser to keep students' saved work,
// and keeps the browser's install prompt so the Start here page can offer an "Install" button.
(function () {
  try {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  } catch (e) {}

  var listeners = [];
  var I = window.PWAInstall = {
    event: null,
    installed: false,
    standalone: function () {
      try { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true || /^android-app:/.test(document.referrer); } catch (e) { return false; }
    },
    ios: function () { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },
    touch: function () { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } },
    onchange: function (fn) { listeners.push(fn); },
    prompt: function () {
      var ev = I.event; if (!ev) return Promise.resolve('unavailable');
      I.event = null; fire();
      ev.prompt();
      return ev.userChoice.then(function (c) { if (c && c.outcome === 'accepted') { I.installed = true; } fire(); return c ? c.outcome : 'dismissed'; }).catch(function () { return 'dismissed'; });
    }
  };
  function fire() { listeners.slice().forEach(function (f) { try { f(); } catch (e) {} }); }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); I.event = e; fire(); });
  window.addEventListener('appinstalled', function () { I.installed = true; I.event = null; fire(); });
})();
