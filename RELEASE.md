# Release 1.0.0 beta — 2026-11-18

Public URL: https://pathfinderview.github.io/price-lens/
Source: https://github.com/pathfinderview/price-lens

## Verified locally
- Four unit-test groups: price parsing, invalid values, candidate extraction, conversion.
- Mobile Chrome viewport: no horizontal overflow at 390 px; visual screenshot reviewed.
- Live THB/INR reference-rate response, correct 589 × 2.7623 = ₹1,626.99.
- Real browser Tesseract OCR on synthetic label detected 589.00.
- Synthetic camera open/close; stream released.
- Candidate selection, reset, help dialog, identical currencies, saved-rate fallback.

## Not yet verified
- Physical iPhone/Android camera, permission UX, home-screen installation.
- Real shop labels across fonts, lighting, scripts or glare.
- Continuous AR conversion is not implemented; this beta uses still capture.

## Dependency audit
The current registry reports a high-severity picomatch pattern-processing advisory in Vite's build dependency tree; npm audit fix did not resolve it (registry latest picomatch 4.0.7 at build time). This app ships static assets only, does not publish a Vite server, and does not accept user-supplied glob patterns. Track remediation when a patched version is available; do not claim a clean dependency audit.
