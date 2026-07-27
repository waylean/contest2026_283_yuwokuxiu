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
| Canonical algorithm and generated runtime parity | Pass |
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
services. The application continued through both missing services. Heart-rate
accuracy and target-specific brightness behavior require the final 10 Pro
real-device pass.

## Blind review

Two read-only reviewers separately audited runtime and algorithm behavior, and
product, evidence and competition compliance. The phase was reworked after
review to remove the unusable 200 ms sensor fallback, clean up failed sensor
subscriptions, preserve active elapsed time in recovery snapshots, refresh
history after cold load, reject poor-direction impacts, replay the production
warm-up path, reduce storage writes and make emulator screenshots fail on
blank output.

The review does not claim field accuracy. A labeled real-device sensor dataset
and the long-session test below remain required before accuracy or endurance
claims are made.

## Remaining gate

Install the generated RPK on Xiaomi Smart Band 10 Pro and verify:

1. A 20-minute training session with at least 30 deliberate swings.
2. Normal walking, preparation and post-hit recovery do not inflate the count.
3. Heart-rate values update without affecting accelerometer sampling.
4. End the session and observe the device for at least 30 seconds.
5. Reopen the app and confirm the session summary appears in history.
