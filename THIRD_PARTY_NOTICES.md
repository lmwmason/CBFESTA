# Third-Party Notices

CBFESTA uses the following externally maintained software and visual assets. No assets were copied from Toss product screenshots or reverse-engineered from proprietary applications.

## React and React DOM

- Source: https://github.com/facebook/react
- Version: 19.3.0
- License: MIT

## react-router-dom

- Source: https://github.com/remix-run/react-router
- Version: 7.18.4
- License: MIT
- Use in CBFESTA: client-side routing for the student, booth-operator, and admin surfaces.

## Tossface

- Source: https://github.com/toss/tossface
- Version: 1.6.1
- License: Tossface License (`LICENSE` in the official repository)
- Use in CBFESTA: expressive emoji font for mission and festival illustrations, loaded from the official repository release through jsDelivr.
- Conditions observed: CBFESTA does not sell or modify Tossface. This notice preserves the source and license reference required for redistribution/bundling.
- Full license text: https://github.com/toss/tossface/blob/main/LICENSE
- Copyright notice: https://toss.im/tossface/copyright

## Lucide

- Source: https://github.com/lucide-icons/lucide
- Version: lucide-react 1.48.0
- License: ISC
- Use in CBFESTA: functional interface icons such as navigation, search, location, QR, and actions.

## Motion

- Source: https://github.com/motiondivision/motion
- Version: 13.4.3
- License: MIT
- Use in CBFESTA: the sign-in sheet's entrance and layout transitions.

## Supabase JavaScript Client

- Source: https://github.com/supabase/supabase-js
- Version: 2.117.1
- License: MIT
- Use in CBFESTA: authenticated access to the festival database, role-aware data, and asset storage.

## node-qrcode

- Source: https://github.com/soldair/node-qrcode
- Version: qrcode 1.5.4
- License: MIT
- Use in CBFESTA: generates the scan-ready QR image for the dedicated booth monitor display.

## qr-scanner

- Source: https://github.com/nimiq/qr-scanner
- Version: 1.4.2
- License: MIT
- Use in CBFESTA: camera-based QR code scanning for booth check-in.

## react-markdown

- Source: https://github.com/remarkjs/react-markdown
- Version: 10.1.0
- License: MIT
- Use in CBFESTA: renders booth operators' Markdown-authored booth descriptions as sanitized React elements (no raw HTML pass-through).

## Fonts

- Pretendard — https://github.com/orioncactus/pretendard — SIL Open Font License 1.1
- Use in CBFESTA: the sole UI typeface across the app.

## Evaluated but not included

- Toss `overlay-kit` (MIT): useful and actively maintained, but unnecessary for the current single search overlay. Avoided to keep the initial bundle and abstraction surface smaller.
- Toss `use-funnel` (MIT): not introduced because the current experience has no multi-step funnel.
- Toss `Suspensive`: not introduced because native React Suspense is sufficient for the app's loading boundaries.
- Toss functional icons/animation assets: not included because no independent, officially distributed package with clearly suitable redistribution terms was identified for this project. Lucide and Motion are used instead.
