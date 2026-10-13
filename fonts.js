// Shared by content.js and popup.js. `files` maps CSS weight -> file name inside fonts/<dir>/.
// `var` (not const) so injecting this file into the same page twice does not throw.
var FARSIAMO_FONTS = [
  {
    id: "vazir", name: "وزیر", dir: "vazir", scale: 115,
    files: { 400: "Vazir.ttf", 700: "Vazir Bold.ttf" },
  },
  {
    id: "dana", name: "دانا", dir: "dana", scale: 100,
    files: {
      100: "DanaFaNum-Hairline.woff2", 200: "DanaFaNum-Thin.woff2", 300: "DanaFaNum-Light.woff2",
      400: "DanaFaNum-Regular.woff2", 500: "DanaFaNum-Medium.woff2", 600: "DanaFaNum-DemiBold.woff2",
      700: "DanaFaNum-Bold.woff2", 800: "DanaFaNum-ExtraBold.woff2", 900: "DanaFaNum-Black.woff2",
    },
  },
  {
    id: "iran-yekan", name: "ایران یکان", dir: "iran-yekan", scale: 100,
    files: {
      100: "IRANYekanWebThin.woff2", 300: "IRANYekanWebLight.woff2", 400: "IRANYekanWebRegular.woff2",
      500: "IRANYekanWebMedium.woff2", 700: "IRANYekanWebBold.woff2", 800: "IRANYekanWebExtraBold.woff2",
      900: "IRANYekanWebBlack.woff2",
    },
  },
  {
    id: "kalameh", name: "کلمه", dir: "kalameh", scale: 100,
    files: {
      100: "KalamehWeb(FaNum)-Thin.woff2", 200: "KalamehWeb(FaNum)-ExtraLight.woff2",
      300: "KalamehWeb(FaNum)-Light.woff2", 400: "KalamehWeb(FaNum)-Regular.woff2",
      500: "KalamehWeb(FaNum)-Medium.woff2", 600: "KalamehWeb(FaNum)-SemiBold.woff2",
      700: "KalamehWeb(FaNum)-Bold.woff2", 800: "KalamehWeb(FaNum)-ExtraBold.woff2",
      900: "KalamehWeb(FaNum)-Black.woff2",
    },
  },
  {
    id: "peyda", name: "پیدا", dir: "peyda", scale: 100,
    files: {
      100: "PeydaWeb-Thin.woff2", 200: "peydaWeb-extralight.woff2", 300: "peydaWeb-light.woff2",
      400: "PeydaWeb-Regular.woff2", 500: "PeydaWeb-Medium.woff2", 600: "PeydaWeb-SemiBold.woff2",
      700: "PeydaWeb-Bold.woff2", 800: "PeydaWeb-ExtraBold.woff2", 900: "PeydaWeb-Black.woff2",
    },
  },
  {
    id: "yekan-bakh", name: "یکان بخ", dir: "yekan-bakh", scale: 100,
    files: {
      100: "YekanBakhFaNum-Thin.woff2", 300: "YekanBakhFaNum-Light.woff2", 400: "YekanBakhFaNum-Regular.woff2",
      600: "YekanBakhFaNum-SemiBold.woff2", 700: "YekanBakhFaNum-Bold.woff2",
      800: "YekanBakhFaNum-ExtraBold.woff2", 900: "YekanBakhFaNum-Black.woff2",
    },
  },
];

var FARSIAMO_DEFAULT_FONT = "vazir";

// unicode-range limits the font to Persian glyphs, so Latin text keeps the site's own font.
var FARSIAMO_RANGE =
  "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+200C-200F, U+FB50-FDFF, U+FE70-FEFF";

function farsiamoFontById(id) {
  return FARSIAMO_FONTS.find((f) => f.id === id) || FARSIAMO_FONTS[0];
}

function farsiamoFontFaces(font, family, onlyWeight) {
  return Object.entries(font.files)
    .filter(([w]) => onlyWeight === undefined || Number(w) === onlyWeight)
    .map(([weight, file]) => {
      const src = chrome.runtime.getURL(`fonts/${font.dir}/${encodeURIComponent(file)}`);
      const format = file.endsWith(".woff2") ? "woff2" : "truetype";
      return `@font-face{font-family:"${family}";font-weight:${weight};font-display:swap;size-adjust:${font.scale}%;unicode-range:${FARSIAMO_RANGE};src:url("${src}") format("${format}")}`;
    })
    .join("\n");
}
