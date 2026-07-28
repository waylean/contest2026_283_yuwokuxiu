# Phase 2 Acceptance

Date: 2026-07-27

## Scope

- Xiaomi Smart Band 10 Pro standalone competition edition
- No Android application, phone bridge, network or cloud dependency
- Production accelerometer detector, local summary history and wearable UI

## Automated results

| Check | Result |
| --- | --- |
| Standalone boundary and contest metadata | Pass |
| Canonical scoring/estimation functions and generated runtime parity | Pass |
| Rest and casual-arm false-positive guards | Pass |
| Periodic running-motion guard | Pass |
| Recovery return filter | Pass |
| Drive, smash and elite intensity monotonicity | Pass |
| Racket, intensity and shuttle caps | Pass |
| Synthetic sensor fixture replay after 1.9-second warm-up | Pass |
| JSC-only build, protobuf disabled | Pass |
| RPK installation on 336x480 emulator | Pass |
| Control, metrics, health page navigation | Pass |
| Start, sample, stop, write summary, wait seven seconds | Pass |
| Exit, cold relaunch and history-list restoration | Pass |

## Emulator evidence

Screenshots are in `preview/exports/contest-emulator/`.

- `01-control.png`
- `02-metrics-waveform.png`
- `03-heart-rate.png`
- `04-post-stop-lifecycle.png`
- `05-history-after-relaunch.png`

The generic emulator image lacks the target device's health and brightness
services. The application continued through both missing services. No
heart-rate accuracy or target-specific brightness claim is made from emulator
evidence.

## Blind review

Two read-only reviewers separately audited runtime and algorithm behavior, and
product, evidence and competition compliance. The phase was reworked after
review to remove the unusable 200 ms sensor fallback, clean up failed sensor
subscriptions, preserve active elapsed time in recovery snapshots, refresh
history after cold load, reject poor-direction impacts, replay the production
warm-up path, reduce storage writes and make emulator screenshots fail on
blank output.

The review does not claim field accuracy. Accuracy metrics remain out of scope
until a future video-backed, manually reviewed and frozen field dataset exists.
Current acceptance is limited to deterministic algorithm properties, emulator
lifecycle behavior and explicit capability boundaries.

## Remaining gate

1. Run the automated algorithm, replay, property and privacy checks.
2. Capture start, pause, stop, exit and cold-relaunch behavior in the emulator.
3. Run a bounded long-session emulator scenario and document storage growth.
4. Keep product footage separate from detector-accuracy evidence.
