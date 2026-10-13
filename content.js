(() => {
  const PERSIAN = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const SKIP = "code, pre, kbd, samp, script, style, noscript, svg, math";
  const FIELDS =
    'textarea, input:not([type]), input[type="text"], input[type="search"], [contenteditable="true"], [contenteditable=""]';
  const root = document.documentElement;
  const style = document.createElement("style");
  (document.head || root).appendChild(style);

  let loadedFaces = [];
  let applyToken = 0;

  // Fonts are loaded from buffers (not @font-face URLs) so a site's CSP font-src cannot block them.
  async function applyFont(id) {
    const token = ++applyToken;
    const font = farsiamoFontById(id);
    const family = "Farsiamo-" + font.id;
    try {
      const faces = await Promise.all(
        Object.entries(font.files).map(async ([weight, file]) => {
          const res = await fetch(chrome.runtime.getURL(`fonts/${font.dir}/${encodeURIComponent(file)}`));
          const face = new FontFace(family, await res.arrayBuffer(), {
            weight,
            unicodeRange: FARSIAMO_RANGE,
            display: "swap",
          });
          if ("sizeAdjust" in face) face.sizeAdjust = font.scale + "%";
          return face.load();
        })
      );
      if (token !== applyToken) return;
      loadedFaces.forEach((f) => document.fonts.delete(f));
      faces.forEach((f) => document.fonts.add(f));
      loadedFaces = faces;
      style.textContent = `html[data-farsiamo-on] [data-farsiamo]{font-family:"${family}",var(--farsiamo-orig) !important}`;
    } catch (e) {
      console.warn("Farsiamo: could not load font " + font.id, e);
    }
  }

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
  chrome.storage.sync.get({ enabled: true, font: FARSIAMO_DEFAULT_FONT }, ({ enabled, font }) => {
    applyFont(font);
    apply(enabled);
  });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.font) applyFont(changes.font.newValue);
    if (changes.enabled) apply(changes.enabled.newValue);
  });

  scan(document.body);
})();
