# VASIA Digital Cards

Shared source for customer digital business cards, separate from the portfolio website.

This repository contains reusable code and VASIA branding for customer digital business cards.

## Structure

- `cards/<customer-slug>/card.json`: customer configuration, added only when authorized for the repository's visibility.
- `cards/<customer-slug>/assets/`: that customer's logo, icons and images.
- `templates/rotating-bag.html`: shared mobile card design.
- `shared/card.css` and `shared/card.js`: shared styles, icons, contact actions and Hebrew/Arabic/English behavior.
- `shared/vasia-logo-light.svg`: small VASIA footer logo linking to https://vasia.dev/ .
- `examples/card.example.json`: fictional setup example; it is not an active customer.
- `cards/demo/`: a published demo card with fictional details (reserved example phone numbers, `example.com`), used to try the card on a real phone at `/demo/`. It is not a customer; remove it when no longer needed.

## Build

Node.js 22 or newer; no dependency installation is required.

```sh
npm test
npm run build
```

The output is `dist/<customer-slug>/index.html`. The site root does not list customers. GitHub stores the source; a separate static host serves public card links.

## Add a customer

Create `cards/<customer-slug>/card.json` from the fictional example and supply verified details plus `assets/logo.png`, `icon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png`, and `share.png`. `icon-180.png` is the iPhone home-screen icon: a PNG of exactly 180×180 pixels with no transparency (the build fails otherwise). Check publication authorization before adding customer information to a public repository. Run tests and build.

After the actual hosted URL is known, set `publicUrl` to the exact customer URL and provide a QR SVG encoded from it as `qrAsset` (for example, `assets/qr.svg`). Until then, sharing and QR display a publication-pending message. No portfolio card URL is assumed.


## Netlify site

`netlify.toml` configures a repository build (`npm run build`, publish `dist`) when Git is connected. A manual Netlify deployment must upload the built `dist` files, not the source tree.

Optionally set `{"homeCard":"customer-slug"}` in `site.json` to redirect the root URL to one customer. Every customer keeps its own folder and path. Root public URLs are accepted only for the explicitly configured home card. QR and sharing use the configured canonical customer URL.

The build emits a client-scoped manifest and offline service worker for Android and desktop installation. On iPhone the card sets Apple web-app metadata (home-screen name, translucent status bar), disables automatic phone-number detection, and serves `contact.vcf` as `text/vcard` so Safari offers to add the contact. Share uses the device share sheet when available and falls back to copying the link. Accessibility preferences are stored on the visitor's device. The main card fits one mobile viewport; dialogs hold additional controls.

The emitted Netlify headers enforce an external-script Content Security Policy. Keep `_headers` and `_redirects` when deploying the built folder manually. Availability of hiding the Netlify badge depends on the team plan; check Project configuration → General → Powered by Netlify badge.
