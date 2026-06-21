# Swap Board — design system

The visual identity for the used-items marketplace. Goal (per project-setup §Styling + the
`frontend-design` skill): a distinctive look that does **not** read as a templated default.

## Concept
A **neighborhood swap-meet board** — peer-to-peer, tactile, human. The product's world is
secondhand goods, hand-tagged prices, classifieds, "for sale" boards. The design borrows that
vernacular but stays crisp and modern.

## Signature element
The **kraft price tag**: every listing shows its price on a die-cut manila tag with a punch hole,
set in mono type (`.price-tag`). Negotiable listings show a stamped **"NEG"** instead of a number.
This is the one memorable device; everything else stays quiet. (`.price-tag` in `index.css`.)

## Tokens (defined in `index.css` `@theme`)
- **Color** — ink `#1C1B29`, paper `#F3F2EF` (neutral-warm, *not* cream), surface `#FFFFFF`,
  line `#E4E2DC`; brand/CTA **grape `#5A3FE0`** (hover `#7B5CFF`); **kraft `#CA9F62`** for tags;
  **sold `#D8412F`** used sparingly for the sold state only.
- **Type** — display **Archivo** (poster/classifieds punch), body **Inter**, mono **Space Mono**
  (price tags, eyebrows, data labels).
- **Radius** — `--radius-card: 1rem`.

## Why this isn't a default
Avoids the three common AI looks: not cream+serif+terracotta (paper is neutral, accent is violet,
display is a grotesque sans), not black+acid-green, not broadsheet hairlines. The marketplace
accent is **violet** — deliberately unlike eBay-blue / Vinted-teal / OfferUp-green / FB-blue.

## Voice
Plain, active, sentence case. Actions say what they do ("List an item", not "Submit"). Empty and
error states give direction, not mood.
