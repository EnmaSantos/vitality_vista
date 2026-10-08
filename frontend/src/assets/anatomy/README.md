# Body selector artwork

`front.webp`, `back.webp`, and the traced paths in
`../../components/bodyMap/anatomy.ts` are adapted from
[js-rich-body-highlighter](https://github.com/crmapache/js-rich-body-highlighter),
revision `107dafe86f91298d66a41ff1c7b7251b073983d8` (MIT).
The complete notice is shipped in `frontend/public/licenses/body-anatomy-MIT.txt`.

Only the male light front/back artwork and its paths are included; no runtime
library is needed. Both illustrations use a 1365 × 2048 source canvas. The SVG
paths use millimeters at 96 DPI (361.15625 × 541.86667). Source pixel offsets
have been converted to SVG translations. Keep image dimensions and path
coordinates in sync when replacing the artwork.

Vitality Vista maps source muscle names to its existing catalog IDs, adds neck,
adductor, and abductor contours, and splits the back trapezius into upper and
middle selectable sections. Rectus abdominis and obliques share the abdominals
filter. This is an exercise discovery illustration.
