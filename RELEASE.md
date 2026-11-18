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

## Public-host verification
The same 12-check browser flow passed against https://pathfinderview.github.io/price-lens/, including OCR model/worker loading from the hosted subpath, synthetic-label recognition, live rates, and offline marked fallback. This verifies hosted desktop Chrome at mobile viewport size, not a physical phone or requester-device rendering.

# Live-camera correction — 2026-11-18

Arun clarified that the app must be live camera, not photo capture. Replaced the first-release flow:
- No upload, shutter, snap or manual candidate step.
- Camera remains running; serial on-device OCR processes fresh frames repeatedly.
- Converted values are drawn at detected word bounding boxes, accounting for object-fit crop.
- Two matching reads confirm a label; missing/stale labels clear automatically.
- Changing currencies updates overlays without another action.
- Camera close/visibility change releases tracks and invalidates pending recognition.
- Live mode puts the camera first and hides the marketing introduction.

Recognition uses sampled frames, not every-frame AR; speed and accuracy on physical phones remain unverified. Earlier still/photo verification above refers to superseded v1.

# Camera-first visual redesign — 2026-11-18

Replaced the interface with a coherent ink/citrus/paper system, original vector illustration, large-code native currency controls, thumb-sized camera actions, source/converted amount hierarchy and collapsed rate details. Desktop editorial layout; mobile tool-first layout. See DESIGN.md for review and evidence limits.
