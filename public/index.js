// Swap Colors
function swapColors() {
  let fgHex = document.getElementById("fgHex");
  let bgHex = document.getElementById("bgHex");
  let fgRGBA = document.getElementById("fgRGBA");
  let bgRGBA = document.getElementById("bgRGBA");
  let temp = fgHex.value;
  fgHex.value = bgHex.value;
  bgHex.value = temp;
  temp = fgRGBA.value;
  fgRGBA.value = bgRGBA.value;
  bgRGBA.value = temp;
  calculateContrast();
}

// Calculate Contrast
function calculateContrast() {
  let fgHex = document.getElementById("fgHex").value;
  let bgHex = document.getElementById("bgHex").value;
  let fgRGBA = document.getElementById("fgRGBA").value;
  let bgRGBA = document.getElementById("bgRGBA").value;
  let colorRatioBox = document.getElementById("color-ratio");
  let fgL = luminance(...parseColor(fgRGBA || fgHex));
  let bgL = luminance(...parseColor(bgRGBA || bgHex));
  let contrastRatio = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
  let colorRatio = contrastRatio.toFixed(2);
  colorRatioBox.innerHTML = `${colorRatio} : 1`;

  // Set colors of the demobox
  let demoBox = document.querySelector("#demo-box");
  demoBox.style.color = fgRGBA;
  demoBox.style.backgroundColor = bgRGBA;

  // Set WCAG boxes pass/fail
  document.querySelector("#aa-normal").className =
    colorRatio > 4.5 ? "" : "fail";
  document.querySelector("#aa-large").className = colorRatio > 3 ? "" : "fail";
  document.querySelector("#aaa-normal").className =
    colorRatio > 7 ? "" : "fail";
  document.querySelector("#aaa-large").className =
    colorRatio > 4.5 ? "" : "fail";
}

// Regex to parse color
function parseColor(input) {
  let m;
  // Prepend '#' if not present
  if (/^[a-f0-9]{6}$/i.test(input)) {
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

// Keep inputs in sync
function syncInputs(hexInput, rgbaInput) {
  hexInput.addEventListener("input", function () {
    // Prepend '#' if not present
    if (hexInput.value.charAt(0) !== "#" && !hexInput.value.startsWith("rgb")) {
      hexInput.value = "#" + hexInput.value;
    }
    rgbaInput.value = hexInput.value;
    calculateContrast();
  });
  rgbaInput.addEventListener("input", function () {
    function rgbaToHex(rgba) {
      let parts = rgba
        .substring(rgba.indexOf("(") + 1, rgba.lastIndexOf(")"))
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
    try {
      let colorArray = parseColor(rgbaInput.value);
      // Check if the input is an RGBA value
      if (rgbaInput.value.startsWith("rgb")) {
        hexInput.value = rgbaToHex(rgbaInput.value); // Convert RGBA to hex
      } else {
        hexInput.value = rgbaInput.value; // Assign hex value directly
      }
      updateDemoColors(colorArray, colorArray); // Update the demo-box colors
    } catch (e) {
      // Invalid color, do not sync with color picker
    }
    calculateContrast();
  });
}

syncInputs(document.getElementById("fgHex"), document.getElementById("fgRGBA"));
syncInputs(document.getElementById("bgHex"), document.getElementById("bgRGBA"));
window.addEventListener("load", calculateContrast);

// Sets demo colors
function updateDemoColors(foregroundColor, backgroundColor) {
  const demoBox = document.querySelector("#demo-box");
  demoBox.style.color = `rgb(${foregroundColor.toString()})`;
  demoBox.style.backgroundColor = `rgb(${backgroundColor.toString()})`;
}

// Footer Copyright Year
document.getElementById("copyright-year").innerHTML = new Date().getFullYear();
