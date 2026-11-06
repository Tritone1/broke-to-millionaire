# Store-ready UI redesign

## Before and after

| Area | Before | After |
| --- | --- | --- |
| HUD | One cramped row; gear competed with gems | Two fixed rows under 15% of an iPhone SE screen, reserved avatar/cash/gems/gear widths, three meters, date/age, and one speed control |
| Home scene | Empty code-drawn box with three generic characters | Full-bleed apartment illustration, one large animated player, lighting/depth/ambient layers, and story-relevant objects |
| Actions | Duplicate Work/Study buttons plus a covering banner | Desk, laptop, and door action bubbles live inside the scene; the next goal is a collapsible chip |
| Navigation | Eight horizontally scrolling tabs and lock overflow | Five fixed destinations: Home, Career, Business, Market, More; locks are cards inside their screens |
| Characters | Shape-drawn SVG avatars | Raster player/NPC sprites plus a manifest-driven atlas for body, outfit, head, hair, and face layers |
| Events | Static scene above a plain modal | Full-screen illustrated scene, player plus one NPC, typewriter dialogue, springing choices, and bad-outcome shake |
| Economy | Late fees compounded old late fees during offline month loops | Bounded non-compounding late balance; new lives start homeless with $0 bills; the first practical lifestyle costs $325 against $900 courier income |
| Onboarding | No focused first-minute path | Starter gig adds the first $50 paycheck, guides the courier interview, then asks the player to choose housing and food before studying |

## Screenshot matrix

All files are real renders captured from the running Expo web bundle.

| Screen | 375×667 | 430×932 |
| --- | --- | --- |
| Home | `artifacts/screenshots/home-se.png` | `artifacts/screenshots/home-large.png` |
| Career | `artifacts/screenshots/career-se.png` | `artifacts/screenshots/career-large.png` |
| Market | `artifacts/screenshots/market-se.png` | `artifacts/screenshots/market-large.png` |
| Event | `artifacts/screenshots/event-se.png` | `artifacts/screenshots/event-large.png` |
