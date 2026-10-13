const services = [
	{ name: "ChatGPT", host: "chatgpt.com", icon: "GPT", color: "#0b7662", background: "#d6f0e8" },
	{ name: "ChatGPT", host: "chat.openai.com", icon: "GPT", color: "#0b7662", background: "#d6f0e8" },
	{ name: "Gemini", host: "gemini.google.com", icon: "G", color: "#2463c5", background: "#dbeafe" },
	{ name: "AI Studio", host: "aistudio.google.com", icon: "AI", color: "#2463c5", background: "#dbeafe" },
	{ name: "Claude", host: "claude.ai", icon: "Cl", color: "#a34822", background: "#fce3d8" },
	{ name: "Copilot", host: "copilot.cloud.microsoft", icon: "Co", color: "#086c70", background: "#d7f1f2" },
	{ name: "Copilot", host: "m365.cloud.microsoft", icon: "Co", color: "#086c70", background: "#d7f1f2" },
	{ name: "Copilot", host: "copilot.microsoft.com", icon: "Co", color: "#086c70", background: "#d7f1f2" },
	{ name: "Copilot", host: "microsoft365.com", icon: "Co", color: "#086c70", background: "#d7f1f2" },
	{ name: "Perplexity", host: "perplexity.ai", icon: "Px", color: "#0e7490", background: "#d9f0f6" },
	{ name: "DeepSeek", host: "chat.deepseek.com", icon: "Ds", color: "#2563eb", background: "#dceaff" },
	{ name: "Grok", host: "grok.com", icon: "Gr", color: "#30343a", background: "#e6e8eb" },
	{ name: "Mistral", host: "chat.mistral.ai", icon: "Mi", color: "#e75b21", background: "#feeadc" },
	{ name: "Qwen", host: "chat.qwen.ai", icon: "Q", color: "#5b4bc4", background: "#e9e5ff" },
	{ name: "Poe", host: "poe.com", icon: "P", color: "#8947a1", background: "#f1dff6" },
	{ name: "Meta AI", host: "meta.ai", icon: "M", color: "#1261d3", background: "#e0ecff" },
	{ name: "HuggingChat", host: "huggingface.co", path: "/chat", icon: "HF", color: "#9a6a00", background: "#ffefbd" },
];

const box = document.getElementById("enabled");
const servicesElement = document.getElementById("services");
const activeNameElement = document.getElementById("active-name");
const activeIconElement = document.getElementById("active-icon");
const footerElement = document.getElementById("footer-message");

function matchesService(service, url) {
	return (
		url &&
		(url.hostname === service.host || url.hostname.endsWith(`.${service.host}`)) &&
		(!service.path || url.pathname.startsWith(service.path))
	);
}

function makeIcon(service, large = false) {
	const icon = document.createElement("span");
	icon.className = large
		? "grid size-10 place-items-center rounded-xl text-[11px] font-bold"
		: "grid size-8 place-items-center rounded-lg text-[10px] font-bold";
	icon.textContent = service.icon;
	icon.style.color = service.color;
	icon.style.backgroundColor = service.background;
	return icon;
}

function renderServices(activeService) {
	const shownHosts = new Set();
	for (const service of services) {
		if (shownHosts.has(service.name)) continue;
		shownHosts.add(service.name);
		const isActive = activeService?.name === service.name;
		const item = document.createElement("div");
		item.className = isActive
			? "grid h-12 place-items-center rounded-xl bg-white shadow-sm ring-2 ring-emerald-600 transition"
			: "grid h-12 place-items-center rounded-xl bg-white opacity-40 ring-1 ring-zinc-200/80 grayscale transition";
		item.title = service.name;
		item.setAttribute("aria-label", service.name);
		item.append(makeIcon(service));
		servicesElement.append(item);
	}
}

function showActiveService(activeService) {
	if (!activeService) {
		activeNameElement.textContent = "سرویس پشتیبانی‌نشده";
		activeIconElement.textContent = "AI";
		footerElement.textContent = "این افزونه فقط در سرویس‌های نمایش‌داده‌شده فعال است.";
		return;
	}

	activeNameElement.textContent = activeService.name;
	activeIconElement.replaceWith(makeIcon(activeService, true));
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
const fontSample = document.getElementById("font-sample");
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
	fontSample.style.fontFamily = previewFamily(id);
}

fontSelect.addEventListener("change", () => {
	showFont(fontSelect.value);
	chrome.storage.sync.set({ font: fontSelect.value });
});

chrome.storage.sync.get({ font: FARSIAMO_DEFAULT_FONT }, ({ font }) => showFont(farsiamoFontById(font).id));

findActiveService().then((activeService) => {
	showActiveService(activeService);
	renderServices(activeService);
});
