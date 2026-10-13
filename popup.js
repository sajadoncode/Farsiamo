const services = [
	{ name: "ChatGPT", host: "chatgpt.com", icon: "chatgpt" },
	{ name: "ChatGPT", host: "chat.openai.com", icon: "chatgpt" },
	{ name: "Gemini", host: "gemini.google.com", icon: "gemini" },
	{ name: "AI Studio", host: "aistudio.google.com", icon: "aistudio" },
	{ name: "Claude", host: "claude.ai", icon: "claude" },
	{ name: "Copilot", host: "copilot.cloud.microsoft", icon: "copilot" },
	{ name: "Copilot", host: "m365.cloud.microsoft", icon: "copilot" },
	{ name: "Copilot", host: "copilot.microsoft.com", icon: "copilot" },
	{ name: "Copilot", host: "microsoft365.com", icon: "copilot" },
	{ name: "Perplexity", host: "perplexity.ai", icon: "perplexity" },
	{ name: "DeepSeek", host: "chat.deepseek.com", icon: "deepseek" },
	{ name: "Grok", host: "grok.com", icon: "grok" },
	{ name: "Mistral", host: "chat.mistral.ai", icon: "mistral" },
	{ name: "Qwen", host: "chat.qwen.ai", icon: "qwen" },
	{ name: "Poe", host: "poe.com", icon: "poe" },
	{ name: "Meta AI", host: "meta.ai", icon: "meta" },
];

const box = document.getElementById("enabled");
const servicesElement = document.getElementById("services");

function matchesService(service, url) {
	return (
		url &&
		(url.hostname === service.host || url.hostname.endsWith(`.${service.host}`)) &&
		(!service.path || url.pathname.startsWith(service.path))
	);
}

function makeIcon(service) {
	const img = document.createElement("img");
	img.src = `icons/${service.icon}.svg`;
	img.alt = "";
	img.className = "size-7 object-contain brightness-0 invert";
	return img;
}

function renderServices(activeService) {
	const shownNames = new Set();
	for (const service of services) {
		if (shownNames.has(service.name)) continue;
		shownNames.add(service.name);
		const isActive = activeService?.name === service.name;
		const item = document.createElement("div");
		item.className = isActive
			? "grid h-[72px] place-items-center bg-sky-950/60 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.55)]"
			: "grid h-[72px] place-items-center bg-gray-950 opacity-35 transition hover:opacity-70";
		item.title = service.name;
		item.setAttribute("aria-label", service.name);
		item.append(makeIcon(service));
		servicesElement.append(item);
	}
}

async function getActiveTab() {
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		return tab || null;
	} catch {
		return null;
	}
}

function parseUrl(value) {
	try {
		return new URL(value);
	} catch {
		return null;
	}
}

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => (box.checked = enabled));
box.addEventListener("change", () => chrome.storage.sync.set({ enabled: box.checked }));

const fontSelect = document.getElementById("font-select");
const previewStyle = document.createElement("style");
previewStyle.textContent =
	farsiamoFontFaces({ ...farsiamoFontById("vazir"), scale: 100 }, "FarsiamoUI") +
	"\n" +
	FARSIAMO_FONTS.map((f) => farsiamoFontFaces(f, "FarsiamoPreview-" + f.id, 400)).join("\n");
document.head.append(previewStyle);

const previewFamily = (id) => `"FarsiamoPreview-${id}", Tahoma, sans-serif`;

for (const font of FARSIAMO_FONTS) {
	const option = new Option(font.name, font.id);
	option.style.fontFamily = previewFamily(font.id);
	fontSelect.append(option);
}

function showFont(id) {
	fontSelect.value = id;
	fontSelect.style.fontFamily = previewFamily(id);
}

fontSelect.addEventListener("change", () => {
	showFont(fontSelect.value);
	chrome.storage.sync.set({ font: fontSelect.value });
});

chrome.storage.sync.get({ font: FARSIAMO_DEFAULT_FONT }, ({ font }) => showFont(farsiamoFontById(font).id));

const BUTTON_ADD = "shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-950 transition hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";
const BUTTON_REMOVE = "shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

const siteSection = document.getElementById("site-section");
const siteMessage = document.getElementById("site-message");
const siteHost = document.getElementById("site-host");
const siteButton = document.getElementById("site-button");

async function setupSiteSection(tab, url) {
	const origin = `https://${url.hostname}/*`;
	let added = await chrome.permissions.contains({ origins: [origin] });

	const render = () => {
		siteMessage.textContent = added ? "این سایت فعال است" : "این سایت در فهرست نیست";
		siteButton.textContent = added ? "حذف" : "افزودن";
		siteButton.className = added ? BUTTON_REMOVE : BUTTON_ADD;
	};

	siteHost.textContent = url.hostname;
	siteSection.hidden = false;
	render();

	siteButton.addEventListener("click", async () => {
		if (added) {
			try {
				await chrome.tabs.sendMessage(tab.id, { type: "farsiamo-disable" });
			} catch {}
			added = !(await chrome.permissions.remove({ origins: [origin] }));
		} else if (await chrome.permissions.request({ origins: [origin] })) {
			added = true;
		}
		render();
	});
}

(async () => {
	const tab = await getActiveTab();
	const url = tab?.url ? parseUrl(tab.url) : null;
	const activeService = services.find((service) => matchesService(service, url)) || null;
	renderServices(activeService);
	if (url?.protocol === "https:" && !activeService) setupSiteSection(tab, url);
})();
