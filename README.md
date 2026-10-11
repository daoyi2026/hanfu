# Yizhang — A Handscroll of Chinese Dress

## Preview

Live site: [Yizhang — A Handscroll of Chinese Dress](https://daoyi2026.github.io/hanfu/)

Run a local static server from this directory:

```sh
python3 -m http.server 4175 --bind 127.0.0.1
```

Open `http://127.0.0.1:4175/`. The site has no build step or package dependencies. Favorites are stored in browser-local storage for this origin.

## Candidate version

This independent candidate continues the selected pre-Gemini baseline at `work/publish-hanfu`, commit `d658adb`. Its source directory is `outputs/hanfu-expanded`; port `4175` is reserved for previewing this variant. The previously published baseline remains untouched.

## Contents

- Nine historical periods form one horizontally continuous handscroll.
- Each period has three different paired looks: formal or household dress, market dress, and travel or riding dress. Every image contains one woman and one man, for 27 paired illustrations and 54 depicted people.
- The paired illustrations use one pale silk-paper, ink-and-color painting treatment. Poses and activities vary by scene.
- Each pair has descriptions of both people’s garment layers, hairstyles, and accessories. Detail views also provide clothing notes and links to museum records, historical paintings, figurines, and textile references.
- The generated illustrations are available under `assets/paintings/sets/`. Source paintings and object photographs are kept separately under `assets/originals/` and can be opened from each period’s source tab.
- Search, source-type filters, period navigation, pointer dragging, keyboard browsing, image zoom up to 400%, and browser-local favorites are available.
- Incomplete garment-flat diagrams from the prior version were removed; the site does not present sewing patterns.

## Project files

- `assets/paintings/sets/`: 27 generated illustrations, each pairing one woman and one man.
- `assets/paintings/`: earlier nine-image style references; they are not the current paired-look gallery.
- `assets/originals/`: source paintings and object photographs used for comparison.
- `data.js`, `look-data.js`, and `pair-data.js`: period records, source links, and paired clothing, hairstyle, accessory, and scene descriptions.
- `SOURCES.md` and `provenance.json`: source register, image origins, and per-image reference notes.
- `IMAGE-PROMPTS.md`: shared visual brief and the 27 scene descriptions.
- `index.html`, `style.css`, and `app.js`: page structure, visual treatment, and interactions.

## Verification — 2026-10-11

JavaScript syntax checks passed. The local page loaded from this candidate at port `4175`; the handscroll showed all nine periods, each with three paired-look selectors. In the browser, the Ming market look was selected, its detail and hairstyle/accessory tabs were opened, and image zoom was tested at 100%, 125%, and reset to 100%. The Ming official illustration was regenerated and visually checked for distinct, natural hands. The image has 1024 × 1536 pixels.

The current browser view was visually checked for the shared paper background and the continuous handscroll treatment. A full scholarly review of all 27 generated images has not been completed; the museum links remain the references for historical details.
