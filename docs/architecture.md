# Architecture

## Wearable data flow

```text
Accelerometer callback
  -> gravity and dynamic acceleration separation
  -> candidate event window
  -> peak, jerk, impulse, duration, direction consistency
  -> false-positive and recovery-motion filters
  -> swing intensity and estimated shuttle speed
  -> on-screen metrics and local session history
```

## openvela capabilities

| Capability | Use |
| --- | --- |
| Graphics | Seven swipe-accessible screens plus a live acceleration waveform and accepted-swing marker |
| Sensor | Three-axis accelerometer sampling in the foreground |
| Storage | Settings, crash/session recovery and bounded session summaries |
| Brightness | Keep-screen behavior during an active training session |
| Router | Explicit and recoverable application exit |
| Health service | Optional heart-rate sampling with failure isolation |

The competition edition qualifies through the graphics capability. The live
waveform is throttled to 80 ms UI updates so the 20 ms sensor callback remains
focused on sampling and swing detection.

## Runtime boundaries

The wearable remains useful without a phone or network. Heart-rate failure must
not prevent acceleration collection. Sensor callbacks arriving after stop are
discarded before storage or UI mutation.

## Algorithm source

`competitionSwingAlgorithm.js` is the canonical, testable algorithm source.
The openvela runtime used by the target image cannot safely load this local ES
module, so `sync-algorithm-runtime.mjs` deterministically inlines the same source
into `index.ux` before every build. Static checks fail when the generated block
is stale.
