const SCRIPT_ID = "farsiamo-custom";

// Sites the user added are the https origins granted at runtime; each gets the content script.
async function syncCustomSites() {
  const { origins = [] } = await chrome.permissions.getAll();
  const matches = origins.filter((o) => /^https:\/\/[^*]/.test(o));
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  } catch {}
  if (!matches.length) return;
  await chrome.scripting.registerContentScripts([
    {
      id: SCRIPT_ID,
      matches,
      js: ["fonts.js", "content.js"],
      allFrames: true,
      runAt: "document_idle",
      persistAcrossSessions: true,
    },
  ]);
}

// Inject right away so already-open tabs of the new site work without a reload.
async function injectIntoOpenTabs(origins = []) {
  const urls = origins.filter((o) => /^https:\/\/[^*]/.test(o));
  if (!urls.length) return;
  const tabs = await chrome.tabs.query({ url: urls });
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["fonts.js", "content.js"],
      });
    } catch {}
  }
}

chrome.runtime.onInstalled.addListener(syncCustomSites);
chrome.permissions.onAdded.addListener(async (permissions) => {
  await syncCustomSites();
  await injectIntoOpenTabs(permissions.origins);
});
chrome.permissions.onRemoved.addListener(syncCustomSites);
