---
name: openvela-wearable-swing
description: Build and audit a standalone openvela/Vela wearable motion application using accelerometer input, local history, safe sensor lifecycle handling, sensor-fixture replay, and small-screen UI checks. Use when porting, validating, or preparing BMT Smash-like sports applications for openvela wearables.
---

# openvela Wearable Swing

## Workflow

1. Read `src/manifest.json` and identify the target display, declared services,
   package identity, and whether the build is standalone.
2. Reject projects that commit signing keys, AuthKeys, user records, APK/RPK
   binaries, or phone-interconnect code when standalone mode is required.
3. Run the deterministic audit:

```bash
node skills/openvela-wearable-swing/scripts/audit-project.mjs <project-root>
```

4. Run algorithm tests and sensor-fixture replay before building.
5. Build with JSC only unless the target firmware has separately verified
   protobuf compatibility.
6. Verify start, pause, finish, explicit exit, late sensor callbacks, health
   service failure, active-session recovery, and local history.
7. Capture both emulator and real-device evidence when available.

## Guardrails

- Treat displayed speed as an estimate, not a radar measurement.
- Keep health service access optional and failure-isolated.
- Do not rely on a phone, cloud service, or undocumented privilege for the
  standalone competition path.
- Keep one target device until its build and lifecycle checks pass.
- Preserve a minimum safe margin around all 336 x 480 UI content.
