# Farsiamo

Shows Persian text in the **Vazir** font on ChatGPT, Gemini, AI Studio, Claude, Copilot, Perplexity, DeepSeek, Grok, Mistral, Qwen, Poe, Meta AI, and HuggingChat.

## Font
The extension first uses Vazir if it is installed on your system. Otherwise, replace the files at these paths with your Vazir font files:

```
fonts/BZar.ttf
fonts/BZarBold.ttf   (optional)
```

Keep these filenames unchanged; the extension uses them as its bundled fallback. After replacing the files, reload the extension from the browser's extensions page and refresh the chat tab.

## Install
- **Chrome/Edge:** go to `chrome://extensions`, turn on Developer mode, click **Load unpacked**, and select this folder.
- **Firefox:** go to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**, and select `manifest.json`.

Click the toolbar icon to turn the font on or off.

## Security
- The only permission is `storage`. It uses no tabs, history, or host permissions.
- It runs only on the AI sites listed above.
- It loads no remote code and makes no network requests.
- It only adds a `data-` attribute and a CSS variable to page elements. It never reads or sends your chat content.
