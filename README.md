# VASIA Digital Cards

Shared source for customer digital business cards, separate from the portfolio website.

This public repository currently contains only reusable code, VASIA branding and a fictional example. Customer details and customer assets have not been uploaded.

## Structure

- `cards/<customer-slug>/card.json`: customer configuration, added only when authorized for the repository's visibility.
- `cards/<customer-slug>/assets/`: that customer's logo, icons and images.
- `templates/rotating-bag.html`: shared mobile card design.
- `shared/card.css` and `shared/card.js`: shared styles, icons, contact actions and Hebrew/Arabic/English behavior.
- `shared/vasia-logo-light.svg`: small VASIA footer logo linking to https://vasia.dev/ .
- `examples/card.example.json`: fictional setup example; it is not an active customer.

## Build

Node.js 22 or newer; no dependency installation is required.

```sh
npm test
npm run build
```

The output is `dist/<customer-slug>/index.html`. The site root does not list customers. GitHub stores the source; a separate static host serves public card links.

## Add a customer

Create `cards/<customer-slug>/card.json` from the fictional example and supply verified details plus `assets/logo.png`, `icon.svg`, `icon-192.png`, `icon-512.png`, and `share.png`. Check publication authorization before adding customer information to a public repository. Run tests and build.

After the actual hosted URL is known, set `publicUrl` to the exact customer URL and provide a QR SVG encoded from it as `qrAsset` (for example, `assets/qr.svg`). Until then, sharing and QR display a publication-pending message. No portfolio card URL is assumed.
