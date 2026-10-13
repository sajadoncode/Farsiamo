(() => {
  if (window.__farsiamoLoaded) return;
  window.__farsiamoLoaded = true;
  const PERSIAN = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const SKIP = "code, pre, kbd, samp, script, style, noscript, svg, math";
  const FIELDS =
    'textarea, input:not([type]), input[type="text"], input[type="search"], [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]';
  const root = document.documentElement;
  const style = document.createElement("style");
  (document.head || root).appendChild(style);

  const dirStyle = document.createElement("style");
  dirStyle.textContent =
    "html[data-farsiamo-on] [data-farsiamo-rtl]{direction:rtl !important;text-align:start !important}";
  (document.head || root).appendChild(dirStyle);

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

  // Nearest ancestor that lays out as a block, so direction applies to the whole paragraph.
  function blockOf(el) {
    while (el && el !== document.body && el !== root) {
      const d = getComputedStyle(el).display;
      if (d !== "inline" && d !== "contents") return el;
      el = el.parentElement;
    }
    return null;
  }

  // Messages follow their first letter; input fields follow the last letter typed so switching language flips them.
  function setDir(block, isField) {
    if (!block) return;
    // <li>, <meter> etc. expose a numeric .value, so only trust string values (inputs, textareas).
    const text = typeof block.value === "string" ? block.value : block.textContent ?? "";
    const letters = text.match(/\p{L}/gu);
    const letter = letters && (isField ? letters[letters.length - 1] : letters[0]);
    block.toggleAttribute("data-farsiamo-rtl", !!letter && PERSIAN.test(letter));
  }

  function mark(el) {
    if (!el || el.closest(SKIP)) return;
    const field = fieldOf(el);
    if (field) {
      // Inner editor paragraphs must not carry their own direction, or they go stale when the language changes.
      const inner = blockOf(el);
      if (inner && inner !== field) inner.removeAttribute("data-farsiamo-rtl");
      setDir(field, true);
    } else {
      setDir(blockOf(el));
    }
    if (el.hasAttribute("data-farsiamo")) return;
    el.style.setProperty("--farsiamo-orig", getComputedStyle(el).fontFamily);
    el.setAttribute("data-farsiamo", "");
  }

  function fieldOf(node) {
    const el = node instanceof Element ? node : node?.parentElement;
    return el?.closest(FIELDS) || null;
  }

  for (const type of ["input", "keyup", "compositionend"]) {
    document.addEventListener(
      type,
      (e) => {
        const field = fieldOf(e.target);
        if (field) setDir(field, true);
      },
      true
    );
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
      const field = fieldOf(m.target);
      if (field) setDir(field, true);
      else if (m.type === "characterData") {
        const block = blockOf(m.target.parentElement);
        if (block?.hasAttribute("data-farsiamo-rtl")) setDir(block);
      }
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
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "farsiamo-disable") apply(false);
  });

  scan(document.body);
})();
