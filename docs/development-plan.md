# Team Work Development Plan

## 1. Project

BMT Smash is a standalone badminton training application for wearable devices.
It recognizes candidate swings from wrist acceleration, records training
history, and presents understandable metrics to recreational players.

## 2. Target

The competition baseline is Xiaomi Smart Band 10 Pro. No external development
board is required. The source will also be built and demonstrated in the
openvela wearable emulator to provide a reproducible open-source execution path.

## 3. Milestones

1. Isolate the verified standalone product baseline.
2. Establish Apache 2.0 licensing, contest branch, checks, logs, and Skill.
3. Extract the production swing detector into independently testable modules.
4. Add sensor-fixture replay for emulator and regression testing.
5. Add real-time acceleration waveform and swing-event graphics.
6. Validate foreground sensor lifecycle, exit, recovery, and long-session storage.
7. Complete real-device comparison on Xiaomi Smart Band 10 Pro.
8. Package source, documentation, test report, and a sub-five-minute Demo.

## 5. Current phase

Milestones 1 through 6 have emulator evidence. Milestone 7 is the current
blocking phase and must produce labeled detector-quality data, a 60-minute
stability report and lifecycle stress results before presentation work is
treated as final.

The official repository has been received. CLA, pull-request merge and the AI
Coding log collector remain parallel submission blockers. Detailed execution
and acceptance criteria are in `phase-3-plan.md`.

## 4. Acceptance

- No phone or cloud is required for a complete training session.
- Normal walking and arm repositioning do not count as high-intensity swings.
- Stop and exit release sensor and health subscriptions.
- A runtime without the health service continues to record acceleration.
- The openvela emulator build is reproducible from documented commands.
- No secret, signing key, AuthKey, user record, APK, or RPK is committed.
