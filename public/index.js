const STORAGE_KEY = "contrast-lab:saved-pairs";
const THEME_KEY = "contrast-lab:theme";
const MAX_SAVED = 10;

const elements = {
  fgTextInput: document.getElementById("fgTextInput"),
  bgTextInput: document.getElementById("bgTextInput"),
  fgColorInput: document.getElementById("fgColorInput"),
  bgColorInput: document.getElementById("bgColorInput"),
  fgError: document.getElementById("fgError"),
  bgError: document.getElementById("bgError"),
  ratio: document.getElementById("color-ratio"),
  preview: document.getElementById("demo-box"),
  recommendations: document.getElementById("recommendations"),
  saveStatus: document.getElementById("saveStatus"),
  savedPairsList: document.getElementById("savedPairsList"),
  swapButton: document.getElementById("swapColorsButton"),
  savePairButton: document.getElementById("savePairButton"),
  clearSavedButton: document.getElementById("clearSavedButton"),
  themeToggleButton: document.getElementById("themeToggleButton"),
  copyrightYear: document.getElementById("copyright-year"),
  statuses: {
    aaNormal: document.getElementById("aa-normal"),
    aaaNormal: document.getElementById("aaa-normal"),
    aaLarge: document.getElementById("aa-large"),
    aaaLarge: document.getElementById("aaa-large"),
    aaComponent: document.getElementById("aa-component"),
    aaaComponent: document.getElementById("aaa-component"),
  },
};

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  elements.themeToggleButton.textContent =
    theme === "dark" ? "Toggle Light" : "Toggle Dark";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

function normalizeHex(input) {
  const value = input.trim();
  if (/^[\da-fA-F]{6}$/.test(value)) return `#${value}`;
  return value;
}

function parseColor(raw) {
  const input = normalizeHex(raw);
  let match;

  if ((match = input.match(/^#([\da-fA-F]{3})$/))) {
    return match[1].split("").map((char) => parseInt(char + char, 16));
  }

  if ((match = input.match(/^#([\da-fA-F]{6})$/))) {
    return [
      parseInt(match[1].slice(0, 2), 16),
      parseInt(match[1].slice(2, 4), 16),
      parseInt(match[1].slice(4, 6), 16),
    ];
  }

  if (
    (match = input.match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|0?\.\d+|1(?:\.0+)?)\s*)?\)$/i
    ))
  ) {
    const rgb = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (rgb.some((channel) => channel > 255)) {
      throw new Error("RGB values must be between 0 and 255.");
    }
    return rgb;
  }

  throw new Error("Use #RRGGBB, #RGB, rgb(), or rgba().");
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function luminance(r, g, b) {
  const channels = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function calculateRatio(fgRgb, bgRgb) {
  const fgLum = luminance(...fgRgb);
  const bgLum = luminance(...bgRgb);
  return (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
}

function setErrorState(input, errorElement, errorMessage) {
  const field = input.closest(".field");
  field.classList.toggle("invalid", Boolean(errorMessage));
  errorElement.textContent = errorMessage;
}

function setPill(pill, passing) {
  pill.classList.remove("pass", "fail");
  pill.classList.add(passing ? "pass" : "fail");
  pill.textContent = passing ? "Pass" : "Fail";
}

function clearPills() {
  Object.values(elements.statuses).forEach((pill) => {
    pill.classList.remove("pass", "fail");
    pill.textContent = "--";
  });
}

function renderRecommendations(items) {
  elements.recommendations.innerHTML = "";
  if (!items.length) {
    const item = document.createElement("li");
    item.textContent = "Current pair already passes AA normal text.";
    elements.recommendations.appendChild(item);
    return;
  }

  items.forEach((suggestion) => {
    const item = document.createElement("li");
    item.textContent = `${suggestion.hex}  (${suggestion.ratio.toFixed(2)}:1)`;
    elements.recommendations.appendChild(item);
  });
}

function suggestForegroundAlternatives(bgRgb, minRatio) {
  const bgLum = luminance(...bgRgb);
  const suggestions = [];

  for (let value = 0; value <= 255; value += 5) {
    const candidate = [value, value, value];
    const ratio = (Math.max(luminance(...candidate), bgLum) + 0.05) /
      (Math.min(luminance(...candidate), bgLum) + 0.05);

    if (ratio >= minRatio) {
      suggestions.push({ hex: rgbToHex(candidate), ratio });
    }
  }

  return suggestions
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 4);
}

function getCurrentState() {
  const state = { fgRgb: null, bgRgb: null, fgError: "", bgError: "" };

  try {
    state.fgRgb = parseColor(elements.fgTextInput.value);
  } catch (error) {
    state.fgError = error.message;
  }

  try {
    state.bgRgb = parseColor(elements.bgTextInput.value);
  } catch (error) {
    state.bgError = error.message;
  }

  return state;
}

function updateTool() {
  const { fgRgb, bgRgb, fgError, bgError } = getCurrentState();
  setErrorState(elements.fgTextInput, elements.fgError, fgError);
  setErrorState(elements.bgTextInput, elements.bgError, bgError);

  if (fgError || bgError) {
    elements.ratio.textContent = "--";
    clearPills();
    renderRecommendations([]);
    return;
  }

  const ratio = calculateRatio(fgRgb, bgRgb);
  elements.ratio.textContent = `${ratio.toFixed(2)}:1`;
  elements.preview.style.setProperty("--preview-body-fg", rgbToHex(fgRgb));
  elements.preview.style.setProperty("--preview-body-bg", rgbToHex(bgRgb));
  elements.preview.style.setProperty("--preview-control-fg", rgbToHex(fgRgb));
  elements.preview.style.setProperty("--preview-control-bg", rgbToHex(bgRgb));

  setPill(elements.statuses.aaNormal, ratio >= 4.5);
  setPill(elements.statuses.aaaNormal, ratio >= 7);
  setPill(elements.statuses.aaLarge, ratio >= 3);
  setPill(elements.statuses.aaaLarge, ratio >= 4.5);
  setPill(elements.statuses.aaComponent, ratio >= 3);
  setPill(elements.statuses.aaaComponent, ratio >= 3);

  if (ratio >= 4.5) {
    renderRecommendations([]);
  } else {
    renderRecommendations(suggestForegroundAlternatives(bgRgb, 4.5));
  }
}

function syncColorPickerFromText(textInput, colorInput) {
  try {
    colorInput.value = rgbToHex(parseColor(textInput.value));
  } catch (error) {
    // Keep current picker value if text input is invalid.
  }
}

function loadSavedPairs() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function savePairs(pairs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
}

function renderSavedPairs() {
  const pairs = loadSavedPairs();
  elements.savedPairsList.innerHTML = "";

  if (!pairs.length) {
    const empty = document.createElement("li");
    empty.className = "helper";
    empty.textContent = "No saved pairs yet.";
    elements.savedPairsList.appendChild(empty);
    return;
  }

  pairs.forEach((pair) => {
    const item = document.createElement("li");
    item.className = "saved-item";
    item.innerHTML = `
      <span class="swatch" style="background:${pair.fg};"></span>
      <span class="swatch" style="background:${pair.bg};"></span>
      <div class="saved-meta">
        <p><strong>${pair.ratio}</strong> contrast</p>
        <code>${pair.fg} on ${pair.bg}</code>
      </div>
      <button type="button" class="button button-small button-secondary">Use</button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      elements.fgTextInput.value = pair.fg;
      elements.bgTextInput.value = pair.bg;
      elements.fgColorInput.value = pair.fg;
      elements.bgColorInput.value = pair.bg;
      updateTool();
      elements.saveStatus.textContent = "Loaded saved pair.";
    });

    elements.savedPairsList.appendChild(item);
  });
}

function saveCurrentPair() {
  const { fgRgb, bgRgb, fgError, bgError } = getCurrentState();
  if (fgError || bgError) {
    elements.saveStatus.textContent = "Fix color errors before saving.";
    return;
  }

  const fg = rgbToHex(fgRgb);
  const bg = rgbToHex(bgRgb);
  const ratio = `${calculateRatio(fgRgb, bgRgb).toFixed(2)}:1`;
  const next = [{ fg, bg, ratio }, ...loadSavedPairs()]
    .filter((item, index, array) => index === array.findIndex((match) => match.fg === item.fg && match.bg === item.bg))
    .slice(0, MAX_SAVED);

  savePairs(next);
  renderSavedPairs();
  elements.saveStatus.textContent = "Pair saved.";
}

function clearSavedPairs() {
  localStorage.removeItem(STORAGE_KEY);
  renderSavedPairs();
  elements.saveStatus.textContent = "Saved pairs cleared.";
}

function swapColors() {
  const fg = elements.fgTextInput.value;
  const bg = elements.bgTextInput.value;
  const fgPicker = elements.fgColorInput.value;
  const bgPicker = elements.bgColorInput.value;

  elements.fgTextInput.value = bg;
  elements.bgTextInput.value = fg;
  elements.fgColorInput.value = bgPicker;
  elements.bgColorInput.value = fgPicker;
  updateTool();
}

elements.fgTextInput.addEventListener("input", () => {
  syncColorPickerFromText(elements.fgTextInput, elements.fgColorInput);
  updateTool();
});
elements.bgTextInput.addEventListener("input", () => {
  syncColorPickerFromText(elements.bgTextInput, elements.bgColorInput);
  updateTool();
});
elements.fgColorInput.addEventListener("input", () => {
  elements.fgTextInput.value = elements.fgColorInput.value.toUpperCase();
  updateTool();
});
elements.bgColorInput.addEventListener("input", () => {
  elements.bgTextInput.value = elements.bgColorInput.value.toUpperCase();
  updateTool();
});
elements.swapButton.addEventListener("click", swapColors);
elements.savePairButton.addEventListener("click", saveCurrentPair);
elements.clearSavedButton.addEventListener("click", clearSavedPairs);
elements.themeToggleButton.addEventListener("click", toggleTheme);

applyTheme(getInitialTheme());
elements.copyrightYear.textContent = new Date().getFullYear();
renderSavedPairs();
updateTool();
