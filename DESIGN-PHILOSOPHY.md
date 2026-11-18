# Price Lens — a delightful pocket instrument

## Brief, 18 November 2026
Arun asks for the craft and traveller empathy of a well-paid Airbnb product designer; notbor.ing is the explicit reference for character and tactility. He explicitly prefers taking time, chunking the work and deciding the philosophy before polishing. No copying their brand or interface; study their principles.

## The job
Standing in a shop abroad, help me understand a price in my own currency without taking a photo, typing, or leaving the moment.

## North star
“I get it. I can get back to exploring.” Recognition and trust are the utility. A delightful pocket instrument is the emotional frame.

## Design decisions
- The product is a lens, not a dashboard or landing page. Mobile is the working app, with camera and result visible together. Desktop uses the same instrument with an adaptive two-panel composition.
- Material story: warm ceramic housing, charcoal optical well, subtle glass reflections, one persimmon-orange action. The distinctive object is a precision lens, not decorative cards.
- On camera start, the optical cover yields to reality. Live video is never disguised as an illustration. No fake prices or invented detection demos.
- Tactility serves action: pressed depth on buttons, quick spring-like settling on currency swaps, a subtle result arrival. No perpetual bouncy UI, forced sounds or fake haptic claims.
- Readable 14–16px body text; 44px+ actions; headings and amounts form the hierarchy. Small labels are reserved for genuinely secondary metadata.
- Searchable currency sheet with clear source/home context, common currencies first and keyboard-accessible selection.
- Honest states: requesting permission, preparing OCR, scanning, confirming, found, rate unavailable, saved rate, permission denied, stopped. No spinner without explanation or escape.
- Rate date and fee caveat remain discoverable; saved/stale rates are surfaced, not silently hidden. Camera data remains local.

## Acceptance
1. Fresh mobile opening needs no explanation or scrolling to reach the primary action.
2. The source/home pair is immediately understandable and changeable with one thumb.
3. Live camera and conversion remain the primary content, with no photo/capture controls.
4. A new price updates without taps; old prices cannot linger when not detected.
5. No clipping on 320px devices, small laptop screens, or with enlarged text.
6. Inspect opening, live-result, searching, picker, error and permission states, not only a hero screenshot.
7. Test real OCR over a changing synthetic video stream; distinguish that from physical-phone validation.

## Source reviewed
- https://notbor.ing/ — “Built like a game, runs like an app”; one purpose, restraint.
- https://notbor.ing/product/camera — tactile premium-camera interface, quick access and privacy.
- https://notbor.ing/words/the-joy-of-building-slow — craft deepens by staying with an idea.

## Reviewed execution
The physical metaphor is built in CSS, not a heavy 3D runtime: knurled lens rim, layered optical glass and a restrained material shadow. These disappear when the camera runs. The camera button has a pressed mechanical depth; currency selection is an accessible dialog with search and focus return. Reduced motion disables decorative transitions. No audio is played and no unsupported haptics are claimed.

Opening, live scan, blank scene, permission denial, missing camera, cancelled request, currency search/no-results and rate metadata are reviewed separately. A cancelled permission request that later resolves releases its camera tracks. Rate requests cannot erase camera errors. OCR pauses while a sheet is open and stops when leaving the app.
