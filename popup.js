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

async function findActiveService() {
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		const activeUrl = tab?.url ? new URL(tab.url) : null;
		return services.find((service) => matchesService(service, activeUrl)) || null;
	} catch {
		return null;
	}
}

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => (box.checked = enabled));
box.addEventListener("change", () => chrome.storage.sync.set({ enabled: box.checked }));

const fontSelect = document.getElementById("font-select");
const previewStyle = document.createElement("style");
previewStyle.textContent =
	farsiamoFontFaces(farsiamoFontById("vazir"), "FarsiamoUI") +
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

findActiveService().then(renderServices);
