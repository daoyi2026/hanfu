# Yizhang — Chronicles of Chinese Dress

A standalone Chinese museum-reading website arranged as one continuous handscroll.

## Run

Open `index.html`, or serve this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

No dependencies or build step. All artifact images, redraws and diagrams are local. Google Fonts is optional; system Songti is the fallback. Browser favorites use the existing `yizhang-saved` key and remain specific to the browser and origin.

## Included

- Nine chronological sections, from pre-Qin to Qing, followed by a contemporary closing passage.
- Nine object records: five textile records and four painting-based records.
- Twelve source images, nine source-guided AI redraws and nine SVG structure diagrams.
- Four detail tabs per record: originals/redraws, flat structure, research, and accessories.
- Four reading essays and fourteen linked institutional/research/image sources.
- Continuous mouse dragging, native horizontal touch scrolling, timeline navigation, keyboard navigation and position slider.
- Nested 100–400% image viewer with panning, reset, double-click and keyboard controls.
- Search, category filters and persistent favorites.

## Evidence boundaries

The chapters are reading periods, not an exhaustive political chronology. Some periods overlap. Each section contains a specific representative object; Liao/Jin/Yuan currently contains Yuan material only. Paintings, surviving copies and excavated textiles are distinguished in each record. Unknown provenance or dimensions remain unknown.

AI redraws preserve broad source relationships for presentation but are not academically validated reconstructions. Original photographs remain available without color manipulation. SVG diagrams distinguish reported dimensions from interpretive contours; they lack complete seam, back-panel and allowance data and are not sewing patterns. See `SOURCES.md` and `provenance.json` for references. Museum photographs retain the original provider's rights; public availability is not a commercial license.

## Verification — 2026-10-03

- JavaScript syntax checks passed.
- All nine records and all four detail tabs opened in the live browser: 36 populated panels, no broken loaded images.
- Original/interpretive image switching, nested image viewer, 400% zoom, image panning and Escape dismissal checked.
- Scroll dragging advanced 790 pixels without opening a detail dialog; timeline positioning and keyboard controls checked.
- Filters returned 5 textile, 4 painting and 9 total records; a specific garment search returned one result.
- A test favorite survived reload and was then removed, preserving the pre-test state.
- Visual checks at 1280 × 900, 390 × 844 and 320 × 740; no document-level horizontal overflow at mobile widths.
- No captured browser warnings or errors in the tested flows.

Native touch gestures have not been tested on physical hardware. Aesthetic approval and scholarly reconstruction accuracy cannot be established by these functional checks.

The project has not been publicly deployed. The previous version is retained in the workspace baseline, outside this release.
