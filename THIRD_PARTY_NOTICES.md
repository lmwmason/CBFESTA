# Third-Party Notices

CBFESTA uses the following externally maintained software and visual assets. No assets were copied from Toss product screenshots or reverse-engineered from proprietary applications.

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
- Use in CBFESTA: interaction springs, entrance transitions, shared layout movement, and overlays.

## Three.js and React Three Fiber

- Sources: https://github.com/mrdoob/three.js and https://github.com/pmndrs/react-three-fiber
- Versions: three 0.186.1; @react-three/fiber 9.8.1
- License: MIT
- Use in CBFESTA: rendering original CBFESTA team artifacts. The geometry, material composition, and art direction in this project are original CBFESTA work.

## Fonts

- Pretendard — https://github.com/orioncactus/pretendard — SIL Open Font License 1.1
- Manrope — https://fonts.google.com/specimen/Manrope — SIL Open Font License 1.1
- Use in CBFESTA: Korean UI text and display numerals/headlines respectively.

## Evaluated but not included

- Toss `overlay-kit` (MIT): useful and actively maintained, but unnecessary for the current single search overlay. Avoided to keep the initial bundle and abstraction surface smaller.
- Toss `use-funnel` (MIT): not introduced because the current experience has no multi-step funnel.
- Toss `Suspensive`: not introduced because native React Suspense is sufficient for the current 3D loading boundary.
- Toss functional icons/animation assets: not included because no independent, officially distributed package with clearly suitable redistribution terms was identified for this project. Lucide and original CBFESTA motion are used instead.
