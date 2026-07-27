# Competition Baseline

## Source

The competition repository was created from the verified standalone build path
of BMT Smash SPR wearable version 0.3.11 on 2026-07-27.

Reference artifact:

`bmtsmash-spr/releases/v0.3.11/rpk/standalone/bmtsmash-band10pro.rpk`

SHA-256:

`7685c7943b03299e1213b054083eb8773d041575a0cc27694f3b0759aa94c411`

The artifact itself is not copied into this repository. It is used only as a
traceable functional baseline.

## Included behavior

- Xiaomi Smart Band 10 Pro layout
- standalone accelerometer collection
- swing detection and false-positive filtering
- local session recovery and history
- current, average, and maximum heart rate when the runtime provides the service
- estimated calories
- score keeping
- explicit exit and sensor cleanup

## Excluded behavior

- Android application
- `system.interconnect`
- phone synchronization
- raw AuthKey or direct Bluetooth logic
- AstroBox plugins and probes
- signing keys and release binaries
- user records and commercial distribution material

## Isolation rule

All competition changes must be made in this repository. Changes must not be
copied back to the commercial repositories unless they are reviewed separately.
