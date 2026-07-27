# Real-device capture tool

This directory is a standalone diagnostic Quick App and offline evidence
toolchain. It is not imported by, built with or packaged into
`quickapp/bmt_smash`.

## Contents

- `src/`: Xiaomi Smart Band 10 Pro diagnostic Quick App.
- `astrobox-collector/`: minimal diagnostic receiver plugin.
- `tools/recover-export.mjs`: restores AstroBox stdout frames.
- `tools/run-astrobox-capture.sh`: starts AstroBox logging and automatically
  restores received sessions when AstroBox exits.
- `tools/merge-capture.mjs`: manifest/chunk validator and JSON/CSV exporter.
- `test/fixtures/`: synthetic anonymous export.
- `DATA_FORMAT.md`: storage keys, schema, integrity and retention rules.

Run structure checks and tests from the repository root:

```sh
npm run capture:check
npm run capture:test
```

Build locally only when an AIoT/openvela Quick App toolchain is available:

```sh
npm --prefix tools/real-device-capture install
npm --prefix tools/real-device-capture run build
```

Generated `build/`, `dist/`, `sign/` and `*.rpk` files remain ignored.

Recover a capture from the AstroBox process log:

```sh
npm run capture:recover -- \
  --input out/astrobox-capture.log \
  --out out/recovered
```

The diagnostic package uses `system.interconnect` only to export the same
manifest/chunk values already committed to `system.storage`. The production
contest package remains independent and has no interconnect capability.

Run `npm run capture:listen` from the repository root for the complete
computer-side receive workflow.
