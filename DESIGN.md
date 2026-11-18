# Price Lens — pocket instrument design

The active design supersedes the earlier ink/citrus landing-page approach. Philosophy and source references are in DESIGN-PHILOSOPHY.md.

## Product priority
A traveller sees a foreign price in a familiar currency without photos, uploads or typing. The mobile interface is the tool itself; the desktop layout rearranges the same controls rather than presenting a marketing page.

## System
- Warm ceramic housing, charcoal optical well, persimmon mechanical button.
- Original CSS optical object and SVG identity; no borrowed brand imagery.
- DM Sans controls, Space Grotesk prices and headings, tabular-feeling numeral hierarchy.
- 44px action targets, explicit focus indicators, reduced-motion alternatives.
- Searchable currency sheet: source vs home context, popular currencies, country/code search, current selection.
- Transparent states: permission pending with cancel, OCR warm-up with progress, scanning, confirming, detected, no detection, rate unavailable, saved rate, denied camera, stopped.
- Result arrival is short and purposeful. No forced audio or continuous decorative animation.
- Rate summary stays visible and opens a detail sheet with date/fees and refresh.

## Known validation boundary
Real OCR is tested through a synthetic changing video stream; this is not a physical phone test. Engine and viewport checks cannot establish real iPhone camera performance, battery consumption, sunlight usability or VoiceOver behavior. Keep those distinctions in release notes.
