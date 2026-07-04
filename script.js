/* script.js — ذهن آبی Mini App
   Loads everything from config.json so future checklists only require
   editing that file. No frameworks, no build step.
*/

(function () {
  "use strict";

  let CONFIG = null;
  const state = { checked: [] };

  const el = {
    title: document.getElementById("title"),
    subtitle: document.getElementById("subtitle"),
    checklist: document.getElementById("checklist"),
    counter: document.getElementById("counter"),
    resetBtn: document.getElementById("resetBtn"),
    resultBtn: document.getElementById("resultBtn"),
  };

  function loadConfig() {
    return fetch("config.json")
      .then((res) => {
        if (!res.ok) throw new Error("config.json failed to load: " + res.status);
        return res.json();
      });
  }

  function applyBrandColors(colors) {
    if (!colors) return;
    const root = document.documentElement.style;
    if (colors.primary) root.setProperty("--primary", colors.primary);
    if (colors.secondary) root.setProperty("--secondary", colors.secondary);
    if (colors.accent) root.setProperty("--accent", colors.accent);
    if (colors.lightAqua) root.setProperty("--light-aqua", colors.lightAqua);
    if (colors.accentBeige) root.setProperty("--accent-beige", colors.accentBeige);
    if (colors.textNavy) root.setProperty("--text-navy", colors.textNavy);
  }

  function renderHeader() {
    el.title.textContent = CONFIG.header.title;
    el.subtitle.textContent = CONFIG.header.subtitle;
    document.title = CONFIG.meta.clinicName + " — " + CONFIG.header.title;
  }

  function renderChecklist() {
    el.checklist.innerHTML = "";
    state.checked = new Array(CONFIG.questions.length).fill(false);

    CONFIG.questions.forEach((qText, i) => {
      const li = document.createElement("li");
      li.className = "q-row";
      li.setAttribute("role", "checkbox");
      li.setAttribute("aria-checked", "false");
      li.setAttribute("tabindex", "0");

      const text = document.createElement("span");
      text.className = "q-text";
      text.textContent = qText;

      const box = document.createElement("span");
      box.className = "q-check";
      box.setAttribute("aria-hidden", "true");

      li.appendChild(text);
      li.appendChild(box);

      li.addEventListener("click", () => toggleRow(i, li));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleRow(i, li);
        }
      });

      el.checklist.appendChild(li);
    });
  }

  function toggleRow(index, rowEl) {
    state.checked[index] = !state.checked[index];
    rowEl.classList.toggle("checked", state.checked[index]);
    rowEl.setAttribute("aria-checked", String(state.checked[index]));
    updateCounter();
  }

  function toPersianDigits(num) {
    const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return String(num).replace(/[0-9]/g, (d) => fa[d]);
  }

  function getCount() {
    return state.checked.filter(Boolean).length;
  }

  function updateCounter() {
    const count = getCount();
    const total = CONFIG.questions.length;
    const text = CONFIG.footer.counterTemplate
      .replace("{count}", toPersianDigits(count))
      .replace("{total}", toPersianDigits(total));
    el.counter.textContent = text;
  }

  function renderFooter() {
    el.resetBtn.textContent = CONFIG.footer.resetButton;
    el.resultBtn.textContent = CONFIG.footer.resultButton;
  }

  function resetAll() {
    state.checked.fill(false);
    document.querySelectorAll(".q-row").forEach((row) => {
      row.classList.remove("checked");
      row.setAttribute("aria-checked", "false");
    });
    updateCounter();
    window.scrollTo({ top: 0 });
  }

  function getScoreRange(score) {
    return CONFIG.scoring.ranges.find((r) => score >= r.min && score <= r.max)
      || CONFIG.scoring.ranges[CONFIG.scoring.ranges.length - 1];
  }

  function showResult() {
    const score = getCount();
    const range = getScoreRange(score);
    const payload = { score: score, level: range.level };
    renderResultCard(score, range, payload);
  }

  function renderResultCard(score, range, payload) {
    const overlay = document.createElement("div");
    overlay.className = "result-overlay";

    const card = document.createElement("div");
    card.className = "result-card";

    const scoreEl = document.createElement("p");
    scoreEl.className = "score";
    scoreEl.textContent =
        toPersianDigits(score) + " / " + toPersianDigits(CONFIG.questions.length);

    const levelEl = document.createElement("p");
    levelEl.className = "level-label";
    levelEl.textContent = range.label;

    const note = document.createElement("p");
    note.className = "result-note";
    note.textContent = "نتیجه شما ثبت شد.";

    const button = document.createElement("button");
    button.className = "btn btn-primary";
    button.type = "button";
    button.textContent = "ادامه";

    button.addEventListener("click", () => {
        button.disabled = true;
        TG.submitScore(CONFIG.meta.scoreApiUrl, payload).then((ok) => {
            if (ok) {
                TG.close();
            } else {
                button.disabled = false;
                note.textContent = "ثبت نتیجه با خطا مواجه شد. لطفاً دوباره تلاش کنید.";
            }
        });
    });

    card.appendChild(scoreEl);
    card.appendChild(levelEl);
    card.appendChild(note);
    card.appendChild(button);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
}
  function bindFooterActions() {
    el.resetBtn.addEventListener("click", resetAll);
    el.resultBtn.addEventListener("click", showResult);
  }

  function init() {
    TG.ready();
    loadConfig()
      .then((cfg) => {
        CONFIG = cfg;
        applyBrandColors(CONFIG.colors);
        renderHeader();
        renderChecklist();
        renderFooter();
        updateCounter();
        bindFooterActions();
      })
      .catch((err) => {
        el.subtitle.textContent = "خطا در بارگذاری اطلاعات. لطفاً دوباره تلاش کنید.";
        console.error(err);
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
