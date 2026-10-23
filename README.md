# Production Calculator v2.2

Static, mobile-friendly production calculator. No build step, login, server, or external dependencies. Upload `index.html`, `app.js`, and `styles.css` to the repository root and serve with GitHub Pages.

## Included
- Line 1 — Treat Only
- Line 3 — Treat Only / Treat & Pack (Normal Corn, Shrunken Corn, Peas, Spinach, Other)
- Line 4 — Treat Only / Treat & Pack (Peas, Beans)
- Stand Alone — Pack Only, Treated/Untreated, Bag Tare (KG/LB, 3 decimals)
- Bulk Line — Coming Soon placeholder
- Crop and seed-type formula settings, locally saved, with confirmation and restore defaults
- Extra EA suggestion and direct override for Lines 3 and 4
- Regular and custom samples (G/KG/LB/KS)
- Detailed Saved Calculations with View Details, Load, Delete, and local persistence

## Calculation rules
- 1 KG = 2.2046 LB; base KS weight = KS × 1000 ÷ PC ÷ 2.2046.
- Commercial overpack 1%, Parent/Basic 0.5%; Spinach 0.5% in Line 3 and Stand Alone.
- Normal Corn treated chemical weight 1%, Shrunken Corn 1.2%, otherwise 0% by default.
- Treat lines: seed to treat = ceil(base per EA × calculated EA × (1 + overpack) + samples). Chemical weight affects finished bag target, **not** untreated seed to treat.
- Stand Alone: net seed/bag = base × (1 + overpack) × (1 + chemical if treated); total = ceil(net seed/bag × order EA + samples); scale target = net seed/bag + tare. Tare excluded from total.
- Extra EA (Treat & Pack only) = 1 + ceil(Order EA / 100), editable.
- Samples are added after percentages.

## Data storage and privacy
- All calculations run locally in the browser.
- Formula settings and saved calculations use localStorage on the current browser/device. Clearing site data or using private browsing can remove them. No cross-device sync.
- Optional Calculation IDs are entered by users; avoid sensitive identifiers.

## Release checklist
1. Keep a backup of the prior GitHub version.
2. Test each line with known production examples before publishing.
3. Upload all three application files together; leave GitHub Pages configured as before.
4. Refresh the published site and test on mobile and desktop.
