# Price Lens

A mobile-first, camera/photo currency converter. Original implementation inspired by a camera-conversion demonstration; no copied branding or assets.

## Run

Node 22+, `npm ci`, then `npm run dev`. `npm run build` produces a static site in `dist/`. Deploy the contents of `dist/` over HTTPS; camera access requires HTTPS or localhost.

## What ships

- 30 selected currencies, INR home default, THB source default.
- Daily reference rates from Frankfurter v1, with rate date and marked local-cache fallback.
- Rear-camera still scan and photo upload; English/numeric OCR on-device via Tesseract.js.
- Explicit candidate selection, editable amounts, currency swap.
- Local preferences, private image processing, no accounts or analytics.
- Web app manifest, home-screen support where available, service-worker cache.

## Limits

This is a public beta, not continuous augmented-reality tracking and not a native App Store binary. Select the source currency manually. Verify OCR candidates: weights, dates and barcodes can also be recognised as numbers. Reference rates exclude fees. A three-digit suffix is interpreted as thousands (`1,234` → 1234); prices with three decimal places are not supported. AED is not offered because this rate endpoint does not support it. Install behavior and real-device camera performance need a physical iPhone/Android check.

## Verification

`npm test` covers parsing and conversion. `node tests/browser.mjs` runs a browser integration suite against localhost:5178 (uses the macOS Chrome executable): real photo OCR, live rates, fake-camera lifecycle, mobile viewport, invalid inputs, same-currency, dialogs and cached-rate fallback. No physical camera claim is implied by the synthetic camera test.

## Privacy

Photos never leave the browser. The app serves OCR code/model from its own origin. Exchange-rate requests send only the selected pair. Google Fonts requests load display fonts. Host/rate/font providers receive ordinary web request metadata. No API keys, backend, user accounts or analytics.

## Dependencies

Tesseract.js (Apache-2.0), Tesseract.js-core (Apache-2.0) and English tessdata are redistributed under `public/ocr/`; see included license notices. Vite is a build-time tool, not a server shipped in the production release.
