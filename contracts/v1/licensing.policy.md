# Licensing Policy v1

## Allowed licenses (default)
- MIT
- BSD-2-Clause
- BSD-3-Clause
- ISC
- Apache-2.0

## Disallowed licenses (must not be used)
- GPL-2.0, GPL-3.0
- AGPL-3.0
- LGPL (unless explicit written approval and clear dynamic-link separation)

## License review rules
- Every new dependency MUST declare its license.
- If a license is unknown or dual-licensed, it MUST be reviewed and documented in the decision log.
- Any GPL-family license requires explicit written approval.

## License review checklist
- [ ] License type recorded in decision log
- [ ] License is in the allowed list OR has explicit approval
- [ ] No transitive GPL/AGPL dependencies
- [ ] Chess UI library license verified (cm-chessboard is MIT)
- [ ] Chess rules engine license verified (chess.js is BSD-2-Clause)

## CI enforcement
- A CI step MUST verify dependency licenses before release.

