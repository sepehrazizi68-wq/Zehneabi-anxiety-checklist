/* telegram.js
   Thin wrapper around the Telegram WebApp bridge.
   Falls back gracefully when opened outside Telegram (e.g. plain browser testing),
   so the app never crashes and developers can preview it anywhere.
*/

const TG = (function () {
  const native = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  function ready() {
    if (native) {
      native.ready();
      native.expand();
      if (native.setHeaderColor) {
        try { native.setHeaderColor("#003E9B"); } catch (e) {}
      }
    }
  }

  function sendData(payload) {
    const json = JSON.stringify(payload);
    if (native && native.sendData) {
      native.sendData(json);
    } else {
      // Outside Telegram: log so it's visible during local/browser testing.
      console.log("[telegram.js] sendData (no Telegram context):", json);
    }
  }

  function close() {
    if (native && native.close) {
      native.close();
    }
  }

  function isInTelegram() {
    return !!native;
  }

  return { ready, sendData, close, isInTelegram };
})();
