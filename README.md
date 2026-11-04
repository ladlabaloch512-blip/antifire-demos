# ANTIFIRE — Ten Store Design Demos

Ten complete, working design demos for the ANTIFIRE store, built from the ten
Phase 1 concepts. Plain static HTML, CSS and vanilla JavaScript. No build step,
no server needed: open `index.html` in a browser, or host the folder anywhere.

## Structure

    index.html            Combined landing page linking all 10 demos
    shared/
      base.css            Shared layout, components and animation engine styles
      store.js            Shared engine: cart, wishlist, colour picker, search,
                          filters, gallery, slider, checkout, reveal animations
      img/                Photos and the ANTIFIRE logo (logo.jpg)
    design-01-.../        One folder per design:
      style.css           That design's fonts, colours, header, hero, cards
      home.html  shop.html  product.html  cart.html
      checkout.html  confirmation.html  404.html

Each design keeps its own cart, wishlist, colour choice and last order in
localStorage under keys prefixed `af10-<design-id>-`, so the demos never
overwrite each other.

## How to change things

- Logo: replace `shared/img/logo.jpg` with the new logo file (same name).
- Products and prices: edit the `PRODUCTS` list in `build_demos.py` and re-run
  `python3 build_demos.py`, or edit the `window.AF_PRODUCTS` data block that is
  printed into every page. Prices are plain numbers in Pakistani Rupees and are
  formatted automatically.
- Accent colours: every page has a colour picker (top bar). The 10 colours per
  design live in the `DESIGNS` palettes in `build_demos.py`; the first colour
  is the default. Button text colour (black or white) is picked automatically
  for WCAG AA contrast.
- Fonts: each design's Google Fonts link and `--head-font` / `--body-font`
  variables are in its folder's `style.css` header block and the `DESIGNS`
  config in `build_demos.py`.
- Page content: hero text per design is in `DESIGNS` (`hero_h`, `hero_p`);
  shared sections (categories, services, footer) are templates in
  `build_demos.py`.
- Photos: replace files in `shared/img/` keeping the same names.

## Deploy

Upload the whole `antifire-demos` folder to any static host. For GitHub Pages:
create a repository, upload all files and folders keeping the structure, then
Settings, Pages, Deploy from a branch, main, root. All paths are relative, so
the demos also work inside a subfolder.

## Notes

- Demo checkout only: placing an order saves it in the browser and shows a
  confirmation with an AF-2026-XXXX number. No real payment is taken.
- Contact details are placeholders (03XX XXXXXXX, info@antifire.pk,
  Your City, Pakistan) until the real details are supplied.
