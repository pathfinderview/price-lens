import "./style.css";
import { createWorker } from "tesseract.js";
import { parseAmount, extractPrices, convert } from "./core.js";
const $ = (id) => document.getElementById(id);
const currencies = {
  INR: "🇮🇳 Indian rupee",
  USD: "🇺🇸 US dollar",
  EUR: "🇪🇺 Euro",
  GBP: "🇬🇧 British pound",
  THB: "🇹🇭 Thai baht",
  JPY: "🇯🇵 Japanese yen",
  SGD: "🇸🇬 Singapore dollar",
  AUD: "🇦🇺 Australian dollar",
  CAD: "🇨🇦 Canadian dollar",
  CHF: "🇨🇭 Swiss franc",
  CNY: "🇨🇳 Chinese yuan",
  HKD: "🇭🇰 Hong Kong dollar",
  IDR: "🇮🇩 Indonesian rupiah",
  KRW: "🇰🇷 South Korean won",
  MYR: "🇲🇾 Malaysian ringgit",
  NZD: "🇳🇿 New Zealand dollar",
  PHP: "🇵🇭 Philippine peso",
  SEK: "🇸🇪 Swedish krona",
  ZAR: "🇿🇦 South African rand",
  TRY: "🇹🇷 Turkish lira",
  NOK: "🇳🇴 Norwegian krone",
  DKK: "🇩🇰 Danish krone",
  BRL: "🇧🇷 Brazilian real",
  MXN: "🇲🇽 Mexican peso",
  PLN: "🇵🇱 Polish zloty",
  CZK: "🇨🇿 Czech koruna",
  HUF: "🇭🇺 Hungarian forint",
  RON: "🇷🇴 Romanian leu",
  ISK: "🇮🇸 Icelandic króna",
  ILS: "🇮🇱 Israeli shekel",
};
let stream = null,
  workerPromise = null,
  rate = null,
  rateDate = "",
  rateSaved = false,
  requestId = 0;
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
const prefs = read("price-lens-prefs") || {};
for (const id of ["from", "to"])
  for (const [code, name] of Object.entries(currencies)) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${code} · ${name.replace(/^[^A-Za-z]+/, "")}`;
    $(id).append(option);
  }
$("from").value = currencies[prefs.from] ? prefs.from : "THB";
$("to").value = currencies[prefs.to] ? prefs.to : "INR";
const notices = {};
function status(message, kind = "camera") {
  notices[kind] = message;
  const text = Object.values(notices).filter(Boolean).join(" ");
  $("status").textContent = text;
  $("status").hidden = !text;
}
function format(n, currency) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" || currency === "KRW" ? 0 : 2,
  }).format(n);
}
let lastResult = "";
function setText(id, text) {
  if ($(id).textContent !== text) $(id).textContent = text;
}
function render() {
  const from = $("from").value,
    to = $("to").value;
  for (const key of ["from", "to"]) {
    $(`${key}-label`).textContent = $(key).value;
    $(`${key}-name`).textContent = currencies[$(key).value].replace(
      /^[^A-Za-z]+/,
      "",
    );
  }
  $("choose-from").setAttribute(
    "aria-label",
    `Price tag currency: ${from}. Change currency`,
  );
  $("choose-to").setAttribute(
    "aria-label",
    `Home currency: ${to}. Change currency`,
  );
  const amount = parseAmount($("amount").value),
    value = convert(amount, rate);
  const result =
    amount === null
      ? stream
        ? "Looking for a price…"
        : "Ready to explore."
      : value === null
        ? "Rate unavailable"
        : format(value, to);
  setText("converted", result);
  setText(
    "result-label",
    amount === null
      ? stream
        ? "Point at a clear price tag."
        : "A little clarity, wherever you are."
      : "At home, that’s about",
  );
  setText(
    "source-price",
    amount === null
      ? ""
      : `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(amount)} ${from}`,
  );
  setText(
    "result-hint",
    amount === null
      ? stream
        ? "Hold steady. Your lens is reading."
        : "Your next find, in a familiar number."
      : rateSaved
        ? "Saved rate · check the date below"
        : "Estimate · before bank fees",
  );
  if ($("result-confirmed").hidden !== (value === null))
    $("result-confirmed").hidden = value === null;
  const panel = document.querySelector(".result");
  if (panel.dataset.detected !== String(amount !== null))
    panel.dataset.detected = String(amount !== null);
  if (result !== lastResult && amount !== null) {
    panel.classList.remove("changed");
    void panel.offsetWidth;
    panel.classList.add("changed");
  }
  lastResult = result;
  const ratio = rate
    ? `1 ${from} = ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 }).format(rate)} ${to}`
    : "";
  $("rate-detail").textContent = rate ? ratio : "Exchange rate unavailable";
  $("rate-date").textContent = rate
    ? from === to
      ? "Same currency"
      : `${rateSaved ? "Saved rate · " : ""}Reference date ${rateDate}`
    : "Check your connection and refresh";
  $("rate-summary").textContent = rate
    ? `${rateSaved ? "Saved · " : ""}${ratio}`
    : $("refresh").disabled
      ? "Finding the latest rate…"
      : "Rate unavailable · retry";
  $("rate-toggle").dataset.saved = String(rateSaved);
  drawOverlays();
}
async function loadRate() {
  $("refresh").disabled = false;
  const id = ++requestId,
    from = $("from").value,
    to = $("to").value;
  rate = null;
  rateDate = "";
  rateSaved = false;
  save("price-lens-prefs", { from, to });
  render();
  if (from === to) {
    rate = 1;
    status("", "rate");
    render();
    return;
  }
  const cacheKey = `price-lens-rate-${from}-${to}`,
    cached = read(cacheKey);
  if (
    cached &&
    Number.isFinite(cached.rate) &&
    cached.rate > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(cached.date)
  ) {
    rate = cached.rate;
    rateDate = cached.date;
    rateSaved = true;
    render();
  }
  $("refresh").disabled = true;
  render();
  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`,
      { cache: "no-store", signal: AbortSignal.timeout(12000) },
    );
    if (!response.ok) throw Error("Rates unavailable");
    const data = await response.json();
    if (id !== requestId) return;
    const value = data.rates?.[to];
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
    )
      throw Error("Invalid rate");
    rate = value;
    rateDate = data.date;
    rateSaved = false;
    save(cacheKey, { rate, date: rateDate });
    status("", "rate");
  } catch (e) {
    if (id !== requestId) return;
    status(
      rate
        ? "Could not refresh. Showing a saved reference rate—check its date before relying on it."
        : "Could not get an exchange rate for this pair. Check your connection or choose another currency.",
      "rate",
    );
  } finally {
    if (id === requestId) {
      $("refresh").disabled = false;
      render();
    }
  }
}
$("amount").addEventListener("input", render);
for (const id of ["from", "to"])
  $(id).addEventListener("change", () => {
    clearDetections();
    loadRate();
  });
$("swap").onclick = () => {
  const from = $("from").value;
  $("from").value = $("to").value;
  $("to").value = from;
  clearDetections();
  loadRate();
};
$("refresh").onclick = loadRate;
let cameraEpoch = 0,
  loopTimer = null,
  inFlight = false,
  detections = [],
  lastCandidates = [],
  lastRead = 0;
const scanCanvas = document.createElement("canvas");
function clearDetections() {
  detections = [];
  lastCandidates = [];
  lastRead = 0;
  $("amount").value = "";
  render();
}
function drawOverlays() {
  const layer = $("live-overlays");
  layer.replaceChildren();
  for (const item of detections) {
    const tag = document.createElement("div");
    tag.className = "price-overlay";
    tag.style.left = `${item.x * 100}%`;
    tag.style.top = `${item.y * 100}%`;
    tag.style.width = `${item.w * 100}%`;
    tag.style.height = `${item.h * 100}%`;
    const label = document.createElement("span");
    const value = convert(item.value, rate);
    label.textContent =
      value === null ? "Rate unavailable" : format(value, $("to").value);
    if (item.x > 0.55) {
      label.style.left = "auto";
      label.style.right = "-2px";
    }
    if (item.y + item.h > 0.78) {
      label.style.top = "auto";
      label.style.bottom = "100%";
    }
    tag.append(label);
    layer.append(tag);
  }
}
function stopCamera() {
  setCameraUI("idle");
  document.body.classList.remove("live-mode");
  cameraEpoch++;
  clearTimeout(loopTimer);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  $("video").srcObject = null;
  $("viewfinder").classList.remove("camera-active");
  $("camera-controls").hidden = true;
  $("camera-empty").hidden = false;
  $("live-state").textContent = "";
  clearDetections();
}
$("close-camera").onclick = stopCamera;
async function getWorker() {
  if (!workerPromise)
    workerPromise = createWorker("eng", 1, {
      workerPath: new URL("ocr/worker.min.js", document.baseURI).href,
      corePath: new URL("ocr/core/", document.baseURI).href,
      langPath: new URL("ocr/lang/", document.baseURI).href,
      logger: (m) => {
        if (stream && m.status !== "recognizing text") {
          $("live-state").textContent =
            m.status === "loading language traineddata"
              ? "Preparing your lens · first use may take a moment"
              : "Getting your lens ready…";
          $("scan-progress-track").hidden = false;
          $("scan-progress-fill").style.width =
            `${Math.round((m.progress || 0.1) * 100)}%`;
        }
      },
    })
      .then(async (worker) => {
        await worker.setParameters({ tessedit_pageseg_mode: "11" });
        return worker;
      })
      .catch((e) => {
        workerPromise = null;
        throw e;
      });
  return workerPromise;
}
function frameCandidates(data, width, height) {
  const found = [];
  for (const block of data.blocks || [])
    for (const paragraph of block.paragraphs || [])
      for (const line of paragraph.lines || [])
        for (const word of line.words || []) {
          if (word.confidence < 55) continue;
          const prices = extractPrices(word.text);
          if (prices.length !== 1) continue;
          const price = prices[0];
          const box = word.bbox;
          if (!box || price.value <= 0) continue;
          const item = {
            value: price.value,
            raw: price.raw,
            x: box.x0 / width,
            y: box.y0 / height,
            w: (box.x1 - box.x0) / width,
            h: (box.y1 - box.y0) / height,
            confidence: word.confidence,
          };
          if (item.w > 0 && item.h > 0) found.push(item);
        }
  return found.slice(0, 12);
}
function schedule(epoch, delay = 650) {
  if (epoch !== cameraEpoch || !stream) return;
  clearTimeout(loopTimer);
  loopTimer = setTimeout(() => scanLive(epoch), delay);
}
async function scanLive(epoch) {
  if (!stream || epoch !== cameraEpoch) return;
  if (document.querySelector("dialog[open]")) {
    schedule(epoch, 350);
    return;
  }
  if (inFlight) {
    schedule(epoch, 150);
    return;
  }
  const video = $("video"),
    rect = video.getBoundingClientRect();
  if (!video.videoWidth || !rect.width || !rect.height) {
    schedule(epoch, 150);
    return;
  }
  inFlight = true;
  try {
    const worker = await getWorker();
    if (epoch !== cameraEpoch || !stream) return;
    $("scan-progress-track").hidden = true;
    // Match the visible object-fit:cover crop, so OCR coordinates align with the preview.
    const aspect = rect.width / rect.height;
    let sw = video.videoWidth,
      sh = video.videoHeight;
    if (sw / sh > aspect) sw = sh * aspect;
    else sh = sw / aspect;
    const cw = Math.min(1100, Math.round(sw)),
      ch = Math.round(cw / aspect);
    scanCanvas.width = cw;
    scanCanvas.height = ch;
    scanCanvas
      .getContext("2d")
      .drawImage(
        video,
        (video.videoWidth - sw) / 2,
        (video.videoHeight - sh) / 2,
        sw,
        sh,
        0,
        0,
        cw,
        ch,
      );
    const { data } = await worker.recognize(
      scanCanvas,
      {},
      { blocks: true, text: true },
    );
    if (epoch !== cameraEpoch || !stream) return;
    const next = frameCandidates(data, cw, ch);
    // Two consecutive readings suppress fleeting OCR guesses. Do not carry old prices onto new labels.
    detections = next.filter((item) =>
      lastCandidates.some(
        (old) =>
          old.value === item.value &&
          Math.abs(old.x - item.x) < 0.15 &&
          Math.abs(old.y - item.y) < 0.15,
      ),
    );
    lastCandidates = next;
    lastRead = performance.now();
    if (detections.length) {
      const best = [...detections].sort(
        (a, b) => b.h - a.h || b.confidence - a.confidence,
      )[0];
      $("amount").value = String(best.value);
      $("live-state").textContent = "Price found · check the original number";
    } else {
      $("amount").value = "";
      $("live-state").textContent = next.length
        ? "Confirming price…"
        : "Hold a price inside the frame";
    }
    render();
  } catch (e) {
    if (epoch === cameraEpoch && stream) {
      clearDetections();
      $("live-state").textContent = "Scanner unavailable";
      status(
        "The live scanner could not load. Check your connection and reopen the camera.",
      );
      stopCamera();
    }
  } finally {
    inFlight = false;
    schedule(epoch);
  }
}
// Expire labels even if a frame takes unusually long to recognise.
setInterval(() => {
  if (stream && lastRead && performance.now() - lastRead > 2500) {
    detections = [];
    $("amount").value = "";
    render();
  }
}, 400);
function setCameraUI(state) {
  const live = state === "live",
    pending = state === "requesting";
  $("start-camera").hidden = live;
  $("start-camera").disabled = pending;
  $("start-label").textContent = pending
    ? "Waiting for camera…"
    : "Open camera";
  $("close-camera").hidden = !live;
  $("cancel-camera").hidden = !pending;
  $("action-note").textContent = pending
    ? "Allow camera access in your browser to continue."
    : live
      ? "Nothing recorded. Everything stays on your device."
      : "No photos. Just point and understand.";
  $("camera-mode").textContent = live ? "LIVE · ON DEVICE" : "YOUR TRAVEL LENS";
  if (!live) $("scan-progress-track").hidden = true;
}
$("cancel-camera").onclick = () => {
  stopCamera();
  status("");
};
$("start-camera").onclick = async () => {
  status("");
  setCameraUI("requesting");
  const epoch = ++cameraEpoch;
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw Error("unsupported");
    const acquired = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    });
    if (epoch !== cameraEpoch || document.hidden) {
      acquired.getTracks().forEach((t) => t.stop());
      if (epoch === cameraEpoch) stopCamera();
      return;
    }
    stream = acquired;
    document.body.classList.add("live-mode");
    $("video").srcObject = stream;
    $("camera-empty").hidden = true;
    $("camera-controls").hidden = false;
    $("viewfinder").classList.add("camera-active");
    setCameraUI("live");
    await $("video").play();
    if (epoch !== cameraEpoch) return;
    clearDetections();
    $("live-state").textContent = "Getting your lens ready…";
    scanLive(epoch);
  } catch (e) {
    if (epoch === cameraEpoch) {
      stopCamera();
      status(
        e.name === "NotAllowedError"
          ? "Your camera is off. Allow camera access in this site’s browser settings, then try again."
          : e.name === "NotFoundError"
            ? "No camera was found. Open Price Lens on your phone to start exploring."
            : "We couldn’t open the camera. Try opening this link directly in Safari or Chrome, then allow camera access.",
      );
    }
  }
};
// Familiar, searchable bottom sheets instead of cramped currency menus.
let selectionTarget = "from";
const countries = {
  INR: "India",
  USD: "United States America USA",
  EUR: "Europe France Germany Spain Italy Portugal Greece",
  GBP: "United Kingdom Britain UK",
  THB: "Thailand",
  JPY: "Japan",
  SGD: "Singapore",
  AUD: "Australia",
  CAD: "Canada",
  CHF: "Switzerland",
  CNY: "China",
  HKD: "Hong Kong",
  IDR: "Indonesia Bali",
  KRW: "South Korea",
  MYR: "Malaysia",
  NZD: "New Zealand",
  PHP: "Philippines",
  SEK: "Sweden",
  ZAR: "South Africa",
  TRY: "Turkey Türkiye",
  NOK: "Norway",
  DKK: "Denmark",
  BRL: "Brazil",
  MXN: "Mexico",
  PLN: "Poland",
  CZK: "Czechia Czech Republic",
  HUF: "Hungary",
  RON: "Romania",
  ISK: "Iceland",
  ILS: "Israel",
};
const common = ["INR", "USD", "EUR", "GBP", "THB", "JPY", "SGD"];
function drawCurrencyOptions() {
  const query = $("currency-search").value.trim().toLowerCase();
  const root = $("currency-options");
  root.replaceChildren();
  const matches = Object.keys(currencies).filter((code) =>
    `${code} ${currencies[code]} ${countries[code]}`
      .toLowerCase()
      .includes(query),
  );
  const groups = query
    ? [["RESULTS", matches]]
    : [
        ["POPULAR WITH TRAVELLERS", common],
        [
          "ALL CURRENCIES",
          Object.keys(currencies)
            .filter((c) => !common.includes(c))
            .sort(),
        ],
      ];
  if (!matches.length) {
    const p = document.createElement("p");
    p.className = "no-results";
    p.textContent = "No matching currencies. Try a country or a code like INR.";
    root.append(p);
    return;
  }
  for (const [title, codes] of groups) {
    if (!codes.length) continue;
    const heading = document.createElement("div");
    heading.className = "option-heading";
    heading.textContent = title;
    root.append(heading);
    for (const code of codes) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "currency-option";
      button.dataset.code = code;
      button.setAttribute(
        "aria-pressed",
        String(code === $(selectionTarget).value),
      );
      const token = document.createElement("span");
      token.className = "currency-token";
      token.textContent =
        new Intl.NumberFormat("en", {
          style: "currency",
          currency: code,
          currencyDisplay: "narrowSymbol",
        })
          .formatToParts(0)
          .find((p) => p.type === "currency")?.value || code;
      const text = document.createElement("span");
      text.className = "option-text";
      const name = document.createElement("strong");
      name.textContent = currencies[code].replace(/^[^A-Za-z]+/, "");
      const sub = document.createElement("small");
      sub.textContent = code;
      text.append(name, sub);
      button.append(token, text);
      if (code === $(selectionTarget).value) {
        const tick = document.createElement("span");
        tick.className = "option-tick";
        tick.textContent = "✓";
        button.append(tick);
      }
      button.onclick = () => {
        $(selectionTarget).value = code;
        $("currency-dialog").close();
        clearDetections();
        loadRate();
      };
      root.append(button);
    }
  }
}
for (const key of ["from", "to"])
  $("choose-" + key).onclick = () => {
    selectionTarget = key;
    $("currency-context").textContent =
      key === "from"
        ? "THE CURRENCY ON THE LABEL"
        : "THE CURRENCY YOU THINK IN";
    $("currency-title").textContent =
      key === "from" ? "Where are you exploring?" : "What feels like home?";
    $("currency-search").value = "";
    drawCurrencyOptions();
    $("currency-dialog").showModal();
    $("close-currencies").focus();
  };
$("currency-search").addEventListener("input", drawCurrencyOptions);
$("close-currencies").onclick = () => $("currency-dialog").close();
$("rate-toggle").onclick = () => $("rate-dialog").showModal();
$("close-rate").onclick = () => $("rate-dialog").close();
for (const id of ["help", "privacy"])
  $(id).onclick = () => $("info-dialog").showModal();
$("close-info").onclick = () => $("info-dialog").close();
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      dialog.close();
    }
  });
for (const dialog of document.querySelectorAll("dialog"))
  dialog.onclick = (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  };
window.addEventListener("pagehide", stopCamera);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && stream) stopCamera();
});
loadRate();
if ("serviceWorker" in navigator)
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register(new URL("sw.js", document.baseURI))
      .catch(() => {}),
  );
