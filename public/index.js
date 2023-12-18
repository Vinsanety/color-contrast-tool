// Swap Colors
function swapColors() {
  let fgColorInput = document.getElementById("fgColorInput");
  let bgColorInput = document.getElementById("bgColorInput");
  let fgTextInput = document.getElementById("fgTextInput");
  let bgTextInput = document.getElementById("bgTextInput");
  let temp = fgColorInput.value;
  fgColorInput.value = bgColorInput.value;
  bgColorInput.value = temp;
  temp = fgTextInput.value;
  fgTextInput.value = bgTextInput.value;
  bgTextInput.value = temp;
  calculateContrast();
}

// Calculate Contrast
function calculateContrast() {
  let fgColorInput = document.getElementById("fgColorInput").value;
  let bgColorInput = document.getElementById("bgColorInput").value;
  let fgTextInput = document.getElementById("fgTextInput").value;
  let bgTextInput = document.getElementById("bgTextInput").value;
  let colorRatioBox = document.getElementById("color-ratio");
  let fgL = luminance(...parseColor(fgTextInput || fgColorInput));
  let bgL = luminance(...parseColor(bgTextInput || bgColorInput));
  let contrastRatio = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
  let colorRatio = contrastRatio.toFixed(2);
  colorRatioBox.innerHTML = `${colorRatio} : 1`;

  // Set colors of the demobox
  let demoBox = document.querySelector("#demo-box");
  demoBox.style.color = fgTextInput;
  demoBox.style.backgroundColor = bgTextInput;

  // Set WCAG boxes pass/fail
  document.querySelector("#aa-normal").className =
    colorRatio > 4.5 ? "pass" : "fail";
  document.querySelector("#aa-large").className =
    colorRatio > 3 ? "pass" : "fail";
  document.querySelector("#aaa-normal").className =
    colorRatio > 7 ? "pass" : "fail";
  document.querySelector("#aaa-large").className =
    colorRatio > 4.5 ? "pass" : "fail";
  document.querySelector("#aa-component").className =
    colorRatio > 3 ? "pass" : "fail";
  document.querySelector("#aaa-component").className =
    colorRatio > 3 ? "pass" : "fail";
}

// Regex to parse color
function parseColor(input) {
  let m;
  if (
    !input.startsWith("#") &&
    !input.startsWith("rgb") &&
    !input.startsWith("rgba") &&
    /^[a-f0-9]{6}$/i.test(input)
  ) {
    input = "#" + input;
  }
  if ((m = input.match(/^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i))) {
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  } else if (
    (m = input.match(
      /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+(\.\d+)?\s*)?\)$/i
    ))
  ) {
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
  } else {
    throw new Error("Invalid color: " + input);
  }
}

// Find luminance
function luminance(r, g, b) {
  let a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// RGB to Hex
function rgbToHex(rgb) {
  let parts = rgb
    .substring(rgb.indexOf("(") + 1, rgb.lastIndexOf(")"))
    .split(/,\s*/);
  let r = parseInt(parts[0]);
  let g = parseInt(parts[1]);
  let b = parseInt(parts[2]);
  let hex =
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0");
  return hex;
}

// Keep inputs in sync
function syncInputs(colorInput, textInput) {
  textInput.addEventListener("input", function () {
    if (
      textInput.value.charAt(0) !== "#" &&
      /^[0-9A-Fa-f]{6}$/i.test(textInput.value)
    ) {
      textInput.value = "#" + textInput.value;
    }
    try {
      if (textInput.value.startsWith("rgb")) {
        colorInput.value = rgbToHex(textInput.value);
      } else if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(textInput.value)) {
        colorInput.value = textInput.value;
      }
      calculateContrast();
    } catch (e) {
      // Invalid color, do not sync with color picker
    }
  });
  colorInput.addEventListener("input", function () {
    try {
      let colorArray = parseColor(colorInput.value);
      if (colorInput.value.startsWith("rgb")) {
        textInput.value = rgbToHex(colorInput.value);
      } else {
        textInput.value = colorInput.value;
      }
      updateDemoColors(colorArray, colorArray);
    } catch (e) {}
    calculateContrast();
  });
}

syncInputs(
  document.getElementById("fgColorInput"),
  document.getElementById("fgTextInput")
);
syncInputs(
  document.getElementById("bgColorInput"),
  document.getElementById("bgTextInput")
);
window.addEventListener("load", calculateContrast);

// Sets demo colors
function updateDemoColors(foregroundColor, backgroundColor) {
  const demoBox = document.querySelector("#demo-box");
  demoBox.style.color = `rgb(${foregroundColor.toString()})`;
  demoBox.style.backgroundColor = `rgb(${backgroundColor.toString()})`;
}

// Footer Copyright Year
document.getElementById("copyright-year").innerHTML = new Date().getFullYear();
