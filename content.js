(() => {
  const PERSIAN = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const SKIP = "code, pre, kbd, samp, script, style, noscript, svg, math";
  const FIELDS =
    'textarea, input:not([type]), input[type="text"], input[type="search"], [contenteditable="true"], [contenteditable=""]';
  const root = document.documentElement;
  const url = (f) => chrome.runtime.getURL("fonts/" + f);

  // unicode-range limits Vazir to Persian glyphs, so Latin text keeps the site's own font.
  const range =
    "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+200C-200F, U+FB50-FDFF, U+FE70-FEFF";
  const style = document.createElement("style");
  style.textContent = `
@font-face{font-family:"Farsiamo";font-weight:100 500;font-display:swap;size-adjust:115%;unicode-range:${range};
  src:local("Vazir"),local("Vazir Regular"),local("Vazir-FD"),url("${url("BZar.ttf")}") format("truetype")}
@font-face{font-family:"Farsiamo";font-weight:600 900;font-display:swap;size-adjust:115%;unicode-range:${range};
  src:local("Vazir Bold"),local("Vazir-Bold"),local("Vazir"),url("${url("BZarBold.ttf")}") format("truetype"),url("${url("BZar.ttf")}") format("truetype")}
html[data-farsiamo-on] [data-farsiamo]{font-family:"Farsiamo",var(--farsiamo-orig) !important}`;
  (document.head || root).appendChild(style);

  document.fonts.load('16px "Farsiamo"', "فارسی").then(() => {
    if (!document.fonts.check('16px "Farsiamo"', "فارسی")) {
      console.warn(
        "Farsiamo: Vazir was not found. Install Vazir or replace fonts/BZar.ttf with Vazir, then reload the extension."
      );
    }
  });

  function mark(el) {
    if (!el || el.hasAttribute("data-farsiamo") || el.closest(SKIP)) return;
    el.style.setProperty("--farsiamo-orig", getComputedStyle(el).fontFamily);
    el.setAttribute("data-farsiamo", "");
  }

  function scan(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (PERSIAN.test(node.data)) mark(node.parentElement);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches(FIELDS)) mark(node);
    node.querySelectorAll(FIELDS).forEach(mark);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t; (t = walker.nextNode()); ) {
      if (PERSIAN.test(t.data)) mark(t.parentElement);
    }
  }

  const queue = new Set();
  let scheduled = false;
  function flush() {
    scheduled = false;
    for (const n of queue) if (n.isConnected) scan(n);
    queue.clear();
  }
  function enqueue(n) {
    queue.add(n);
    if (!scheduled) {
      scheduled = true;
      setTimeout(flush, 100);
    }
  }

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "characterData") enqueue(m.target);
      else m.addedNodes.forEach(enqueue);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  const apply = (on) => root.toggleAttribute("data-farsiamo-on", on);
  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => apply(enabled));
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) apply(changes.enabled.newValue);
  });

  scan(document.body);
})();
