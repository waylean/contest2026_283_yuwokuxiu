# Phase 3 Plan: Evidence and Competition Depth

## Goal

Move from a validated standalone prototype to a defensible competition entry.
This phase does not add Android linkage or change the Xiaomi Smart Band 10 Pro
baseline.

## P0: Official submission foundation

1. Obtain and accept the organizer-created
   `contest2026_<number>_<team>` repository invitation.
2. Sign the openvela CLA with the registered GitHub account.
3. Migrate this clean history into the assigned repository and submit it by
   fork and pull request.
4. Install and verify the official AI Coding log collector in the full
   openvela `.repo` workspace.
5. Export future competition sessions into `logs/<github-login>/`.
6. Verify a clean checkout with `npm ci`, check, replay and build.

Current status:

- Organizer repository and collaborator access: complete.
- Migration branch: `agent/import-bmt-smash-contest`.
- Fork branch push, clean remote checkout and draft PR #1: complete.
- CLA check, official collector and reviewed logs: complete.
- Pull request self-review and merge: pending.

Acceptance:

- Official repository and pull request URLs are recorded.
- The default competition branch contains the source and logs.
- A clean checkout produces a JSC-only RPK without local credentials.

## P0: Deterministic algorithm evidence

Strengthen the accelerometer detector without presenting non-field gestures as
badminton accuracy evidence.

Required properties:

- axis permutation and sign invariance;
- monotonic response to dynamic-amplitude changes;
- bounded response to normal callback-interval variation;
- rejection of isolated high impacts;
- separation of opposite-direction recovery from same-direction rally swings;
- physical output caps and deterministic replay.

Acceptance:

- Core scoring, estimation and recovery functions in the embedded runtime are
  generated from one source.
- Raw-trace replay is a deterministic preprocessing reference; production-only
  refractory, callback-timing and periodic-motion state remain separately
  covered by runtime and emulator lifecycle checks.
- All properties run from `npm run check` and fail the build on regression.
- Synthetic evidence is labeled as such and never reported as accuracy.
- Algorithm limits and abandoned diagnostic routes are documented.

## P0: Lifecycle and failure isolation

Use deterministic emulator scenarios to cover:

1. Start, pause, resume, end and explicit exit.
2. Cold launch after a completed session.
3. Heart-rate unavailable and permission failure.
4. Delayed callbacks after stop.
5. History persistence and recovery.

Acceptance:

- No unrecoverable navigation in the tested scenarios.
- Sensors and keep-screen state are released after stop.
- History remains readable after cold restart.
- Simulator evidence is clearly separated from real-device product footage.

## P1: Algorithm improvement

1. Keep deterministic physical gates as the baseline.
2. Estimate idle noise without allowing active motion to contaminate it.
3. Generate bounded adaptive candidate thresholds.
4. Add direction-aware recovery filtering.
5. Expand metamorphic and adversarial property tests.

Acceptance:

- Quiet conditions preserve the existing conservative trigger floor.
- Noise adaptation cannot exceed reviewed caps.
- Isolated impact and reverse recovery cases remain rejected.
- Same-direction rapid swings are not rejected solely by timing.
- Every displayed metric has a definition and known limitation.

## P1: openvela and UI evidence

1. Drive accelerometer and health scenarios through the official emulator Mock
   mechanism.
2. Capture continuous waveform frames, accepted-event indication and graceful
   health-service failure.
3. Measure the interaction path for start, pause, finish, history and exit.
4. Keep the 10 Pro baseline stable; prepare round-display adaptation only after
   baseline evidence is complete.
5. Record actionable openvela documentation or tooling improvements and submit
   an upstream issue or pull request when justified.

Acceptance:

- Mock scenarios run deterministically.
- Primary actions require no hidden navigation knowledge.
- Evidence distinguishes simulator output from real-device output.

## P1: Submission and presentation

Prepare:

- introduction PDF or PPTX;
- Demo video no longer than five minutes;
- 90-second live-demo path;
- architecture diagram;
- one-page algorithm property and limitation report;
- one-page product validation report;
- expected judge questions and concise answers;
- offline copies of the RPK, source archive, screenshots and video.

Suggested five-minute Demo:

1. 0:00-0:30: user pain and product.
2. 0:30-1:30: prerecorded real-device product flow.
3. 1:30-2:20: waveform, detector and local history.
4. 2:20-3:15: algorithm evidence and false-positive handling.
5. 3:15-4:00: openvela architecture and failure isolation.
6. 4:00-4:35: AI-Native workflow and reusable Skill.
7. 4:35-5:00: adoption, commercial path and conclusion.

## Phase exit gate

Phase 3 is complete only when:

- official repository, CLA, PR and logs are in place;
- deterministic algorithm and lifecycle checks pass;
- no unsupported accuracy claim remains;
- clean-checkout build is reproducible;
- the five-minute package has passed an independent blind review.
