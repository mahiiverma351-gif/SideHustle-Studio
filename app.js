const $ = (id) => document.getElementById(id);
const form = $("listingForm");
let lastListing = null;
let savedSettings = { url: "http://localhost:11434", model: "qwen2.5:3b" };
let toastTimer;

$("details").addEventListener("input", () => $("charCount").textContent = `${$("details").value.length} / 1200`);
$("setupBtn").addEventListener("click", () => {
  $("modelName").value = savedSettings.model;
  $("ollamaUrl").value = savedSettings.url;
  $("connectionMessage").textContent = "";
  $("setupDialog").showModal();
});
$("closeDialog").addEventListener("click", () => $("setupDialog").close());
$("saveSettings").addEventListener("click", () => {
  savedSettings.model = $("modelName").value.trim() || "qwen2.5:3b";
  savedSettings.url = $("ollamaUrl").value.trim().replace(/\/+$/, "") || "http://localhost:11434";
  $("connectionMessage").textContent = "Settings saved. Generate a listing to try your local model.";
  toast("Local AI settings saved");
  updateConnection("Local model configured");
});
$("testConnection").addEventListener("click", testConnection);
$("historyNav").addEventListener("click", () => {
  if (lastListing) {
    showListing(lastListing);
    toast("Showing your latest draft");
  } else {
    toast("Your recent drafts will appear here after you generate one.");
  }
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = getFormData();
  if (!input.productName || !input.details) return;
  setLoading(true);
  try {
    let listing;
    try {
      listing = await generateWithOllama(input);
      updateConnection("Connected to local AI");
      $("modeBadge").textContent = "Local AI";
    } catch (error) {
      listing = generateDemo(input);
      updateConnection("Demo mode");
      $("modeBadge").textContent = "Demo preview";
      if (error && error.message !== "ollama-unavailable") {
        toast("Local model unavailable. Showing demo output instead.");
      } else {
        toast("Demo mode used. Connect Ollama for real local AI.");
      }
    }
    lastListing = listing;
    showListing(listing);
  } finally {
    setLoading(false);
  }
});
$("regenerateBtn").addEventListener("click", () => form.requestSubmit());
document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    if (!lastListing) return;
    const value = button.dataset.copy === "tags" ? lastListing.tags.join(", ") : lastListing[button.dataset.copy];
    await copyText(value);
    toast("Copied to clipboard");
  });
});
$("copyAllBtn").addEventListener("click", async () => {
  if (!lastListing) return;
  await copyText(`TITLE\n${lastListing.title}\n\nDESCRIPTION\n${lastListing.description}\n\nSEARCH TAGS\n${lastListing.tags.join(", ")}`);
  toast("Full listing copied");
});

function getFormData() {
  return {
    productName: $("productName").value.trim(),
    category: $("category").value,
    platform: $("platform").value,
    details: $("details").value.trim(),
    tone: $("tone").value,
    language: $("language").value
  };
}

async function generateWithOllama(input) {
  const prompt = `You are an expert ecommerce copywriter for independent small businesses. Create an accurate, appealing product listing using only the facts provided. Never invent materials, certifications, dimensions, shipping terms, discounts, or performance claims. Respond ONLY as valid JSON with keys "title", "description", "tags" (array of 8-12 short tags), and "sellerTip".\nPlatform: ${input.platform}\nCategory: ${input.category}\nProduct: ${input.productName}\nDetails: ${input.details}\nBrand voice: ${input.tone}\nOutput language: ${input.language}\nMake the title searchable and natural. Description should have a hook, useful details, and a gentle call to action. Tags should be short search phrases.`;
  const response = await fetch(`${savedSettings.url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: savedSettings.model, prompt, stream: false, format: "json", options: { temperature: 0.7 } })
  });
  if (!response.ok) throw new Error("ollama-unavailable");
  const data = await response.json();
  const parsed = JSON.parse(data.response);
  if (!parsed.title || !parsed.description || !Array.isArray(parsed.tags)) throw new Error("invalid-model-response");
  return {
    title: String(parsed.title),
    description: String(parsed.description),
    tags: parsed.tags.map(String).slice(0, 12),
    sellerTip: String(parsed.sellerTip || "Check that all product claims and details are accurate before publishing.")
  };
}

async function testConnection() {
  const url = $("ollamaUrl").value.trim().replace(/\/+$/, "") || "http://localhost:11434";
  const model = $("modelName").value.trim() || "qwen2.5:3b";
  $("connectionMessage").textContent = "Checking local Ollama…";
  try {
    const response = await fetch(`${url}/api/tags`);
    if (!response.ok) throw new Error();
    const data = await response.json();
    const found = (data.models || []).some(item => item.name === model || item.name.startsWith(`${model}:`));
    $("connectionMessage").textContent = found
      ? `Connected. Model "${model}" is available.`
      : `Ollama is running, but "${model}" was not found. Run: ollama pull ${model}`;
    $("connectionMessage").style.color = found ? "#547343" : "#a36d39";
  } catch {
    $("connectionMessage").textContent = "Could not connect. Check that Ollama is running and browser access is enabled.";
    $("connectionMessage").style.color = "#a36d39";
  }
}

function generateDemo(input) {
  const name = input.productName;
  const details = input.details.replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  const voice = input.tone;
  let title;
  if (input.language === "Hindi") {
    title = `${name} – आपके लिए खास ${input.category} प्रोडक्ट`;
  } else if (input.language === "Hinglish") {
    title = `${name} | Aapke style ke liye special ${input.category}`;
  } else {
    title = voice === "Minimal and premium" ? `${name} | Thoughtfully Made` :
      voice === "Playful and bold" ? `${name} — A Little Something Special` :
      `${name} | A Thoughtful Find for Everyday`;
  }
  let description;
  if (input.language === "Hindi") {
    description = `${name} के साथ कुछ खास चुनें।\n\n${details}।\n\nयह ${input.category.toLowerCase()} पसंद करने वालों के लिए एक अच्छा विकल्प हो सकता है। खरीदने से पहले दिए गए विवरण को ध्यान से देखें।\n\nआज ही अपनी पसंद में शामिल करें।`;
  } else if (input.language === "Hinglish") {
    description = `${name} — aapke liye ek thoughtful pick.\n\n${details}.\n\nAgar aap ${input.category.toLowerCase()} pasand karte hain, toh yeh aapki shortlist mein jagah bana sakta hai. Order karne se pehle details check kar lein.\n\nApni choice ko aaj explore karein!`;
  } else {
    const opening = voice === "Minimal and premium" ? `Meet ${name} — considered, useful, and made to stand out.` :
      voice === "Playful and bold" ? `Say hello to ${name}! A little detail can make a big difference.` :
      voice === "Professional" ? `Introducing ${name}, a considered choice in ${input.category.toLowerCase()}.` :
      `Looking for something special? Meet ${name}.`;
    description = `${opening}\n\n${details}.\n\nWhy it may be right for you\n• A clear, thoughtful choice for your needs\n• Product details are easy to review before you buy\n\nExplore the details and see if ${name} is the right fit for you.`;
  }
  const words = `${name} ${input.category} ${details}`.toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ").split(/\s+/).filter(w => w.length > 2);
  const stop = new Set(["the","and","for","with","that","this","are","from","you","your","its","made","use","can","has","have","who","what","into","our","but","are","will"]);
  const unique = [...new Set(words.filter(w => !stop.has(w)))];
  const tags = unique.slice(0, 10);
  while (tags.length < 8) tags.push(...["smallbusiness", "giftidea", "handpicked"].filter(t => !tags.includes(t)).slice(0, 8 - tags.length));
  return {
    title,
    description,
    tags: tags.slice(0, 12),
    sellerTip: `For ${input.platform}, consider adding clear photos, exact size/material details and a realistic price. Remove any claim you cannot verify.`
  };
}

function showListing(listing) {
  $("emptyState").classList.add("hidden");
  $("loadingState").classList.add("hidden");
  $("results").classList.remove("hidden");
  $("resultTitle").textContent = listing.title;
  $("resultDescription").textContent = listing.description;
  $("resultTags").replaceChildren(...listing.tags.map(tag => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`;
    return span;
  }));
  $("sellerTip").textContent = listing.sellerTip;
  $("draftStatus").textContent = `Draft created · ${new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}`;
}
function setLoading(isLoading) {
  $("generateBtn").disabled = isLoading;
  $("generateBtn").innerHTML = isLoading ? '<span>✦</span> Creating your listing…' : '<span>✦</span> Generate my listing <span class="button-arrow">→</span>';
  if (isLoading) {
    $("emptyState").classList.add("hidden");
    $("results").classList.add("hidden");
    $("loadingState").classList.remove("hidden");
  } else {
    $("loadingState").classList.add("hidden");
    if (!lastListing) $("emptyState").classList.remove("hidden");
  }
}
function updateConnection(label) {
  $("connectionLabel").textContent = label;
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text; document.body.appendChild(area); area.select();
    document.execCommand("copy"); area.remove();
  }
}
function toast(message) {
  const el = $("toast");
  el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
