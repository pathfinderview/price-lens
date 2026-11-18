# Price Lens — interface review and redesign

2026-11-18. Requested by Arun: “please go through ui ux and create a beautiful one.”

## Problems addressed
- Initial mobile hero pushed the actual tool down the page.
- Full currency names competed for narrow select space.
- Repeated instructions, proof badges and rate information had similar visual priority.
- Camera-off and camera-on states did not share a coherent design system.
- Camera overlays needed edge-aware label placement.

## Design system
Warm paper canvas, ink-green camera surface, citrus primary action and detections. DM Sans for controls/numbers; DM Serif Display for editorial moments. Original SVG iconography and price-tag illustration. No photographed product mockups or fake scanned results.

## Hierarchy
1. Away/Home currency controls: large codes, readable currency names, native full-area pickers.
2. Camera: one clear action before permission; live status and 44px close control after opening.
3. Result: original amount beside home-currency label; large converted number and fee caveat.
4. Rate metadata: disclosure, not competing with the result.
5. Privacy/help: available without onboarding friction.

Mobile is the app, not a landing page. Desktop adds contextual editorial content alongside the same working scanner. Permission errors appear directly below the camera. Detection labels switch sides near frame edges.

## Verification
- Visually inspected fresh-context 390px mobile, 1440px desktop and 320px small-screen renderings.
- Confirmed primary camera button stays in the viewport and inside the viewfinder at checked sizes.
- Native currency picker semantics, visible focus rings, reduced-motion treatment, semantic disclosure, help modal and live result announcements.
- All 13 browser integration checks pass: continuous real OCR with changing synthetic video, automatic conversion, stale-label clearing, close/reopen lifecycle, four responsive widths, help and saved-rate fallback. Four unit groups pass; production build passes.
- Physical phones, native permission dialogs, VoiceOver/TalkBack and real-world camera performance remain unverified.
