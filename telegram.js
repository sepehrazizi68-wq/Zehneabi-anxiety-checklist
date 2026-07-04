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

  /**
   * Sends the score to the bot ourselves via a plain HTTP POST, rather than
   * Telegram's own WebApp.sendData(). The launch button is an inline
   * "web_app" button, and Telegram only delivers sendData() as a
   * web_app_data update for Mini Apps launched via a reply-keyboard button
   * or the Menu Button — inline-launched apps can't use it at all. initData
   * is included so the bot can verify this really came from Telegram.
   */
  function submitScore(apiUrl, payload) {
    if (!native) {
      // Outside Telegram: log so it's visible during local/browser testing.
      console.log("[telegram.js] submitScore (no Telegram context):", JSON.stringify(payload));
      return Promise.resolve(true);
    }
    return fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: native.initData, score: payload.score }),
    })
      .then((res) => res.ok)
      .catch((err) => {
        console.error("[telegram.js] submitScore failed:", err);
        return false;
      });
  }

  function close() {
    if (native && native.close) {
      native.close();
    }
  }

  function isInTelegram() {
    return !!native;
  }

  return { ready, submitScore, close, isInTelegram };
})();
