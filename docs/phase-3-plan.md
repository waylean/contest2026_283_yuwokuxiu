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
- CLA, official collector, fork push and pull request: pending.

Acceptance:

- Official repository and pull request URLs are recorded.
- The default competition branch contains the source and logs.
- A clean checkout produces a JSC-only RPK without local credentials.

## P0: Real-device evidence

Create an anonymous labeled dataset and a capture protocol before changing
thresholds again.

Minimum initial dataset:

- 5 users and at least 10 sessions;
- at least 300 labeled badminton swings;
- at least 60 minutes of non-swing negative motion;
- left/right hand and at least two strap-tightness settings;
- synchronized manual event labels with uncertainty noted.

Required metrics:

- precision and recall for effective swings;
- false positives per hour;
- recovery-return rejection rate;
- sampling interval p50, p95 and maximum;
- event-detection latency;
- peak memory if observable, storage growth and battery change.

Acceptance:

- Dataset schema and labeling guide are committed without personal data.
- Baseline results are reproducible from one command.
- Weak cases are documented rather than hidden.

## P0: Stability and lifecycle

Run on Xiaomi Smart Band 10 Pro:

1. One continuous 60-minute training.
2. Thirty start, pause, resume, end and exit cycles.
3. Five forced exits followed by session recovery.
4. Heart-rate unavailable, permission denied and sensor subscription failure.
5. History at capacity and storage-write failure where injectable.
6. Observe for at least 60 seconds after each end operation.

Acceptance:

- No restart, black screen or unrecoverable navigation.
- Sensors and keep-screen state are released after stop.
- History remains readable after cold restart.
- A dated report records firmware, RPK hash and observed limitations.

## P1: Algorithm improvement

1. Freeze the current detector as the baseline.
2. Add a versioned feature-export format for anonymous real-device samples.
3. Analyze failure clusters before changing thresholds.
4. Compare the existing rule detector with a hybrid candidate:
   deterministic physical gates plus a tiny feature classifier.
5. Ship the candidate only when it improves held-out results and fits the
   wearable runtime budget.

Acceptance:

- Train, validation and hold-out sessions are separated by user.
- The comparison includes precision, recall, false positives and runtime cost.
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
- one-page test report;
- one-page product validation report;
- expected judge questions and concise answers;
- offline copies of the RPK, source archive, screenshots and video.

Suggested five-minute Demo:

1. 0:00-0:30: user pain and product.
2. 0:30-1:30: real-device training flow.
3. 1:30-2:20: waveform, detector and local history.
4. 2:20-3:15: algorithm evidence and false-positive handling.
5. 3:15-4:00: openvela architecture and failure isolation.
6. 4:00-4:35: AI-Native workflow and reusable Skill.
7. 4:35-5:00: adoption, commercial path and conclusion.

## Phase exit gate

Phase 3 is complete only when:

- official repository, CLA, PR and logs are in place;
- real-device quality and stability reports pass;
- no unsupported accuracy claim remains;
- clean-checkout build is reproducible;
- the five-minute package has passed an independent blind review.
