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
6. Validate foreground sensor lifecycle, exit and recovery.
7. Complete deterministic algorithm properties, adversarial-input checks and
   emulator lifecycle evidence.
8. Package source, documentation, test report, and a sub-five-minute Demo.

## 5. Current phase

Milestones 1 through 6 have reproducible automated or emulator evidence.
Milestone 7 property checks are complete; its bounded emulator long-session
scenario remains open. Presentation work remains blocked on that capture, the
introduction document and sub-five-minute Demo rather than on an unsupported
field-accuracy claim.

The official repository has been received, the CLA check has passed, and an
official AI Coding log is present. Pull-request merge and final submission
artifacts remain parallel blockers. Detailed execution and acceptance criteria
are in `phase-3-plan.md`.

## 4. Acceptance

- No phone or cloud is required for a complete training session.
- Normal walking and arm repositioning do not count as high-intensity swings.
- Stop and exit release sensor and health subscriptions.
- A runtime without the health service continues to record acceleration.
- The openvela emulator build is reproducible from documented commands.
- No secret, signing key, AuthKey, user record, APK, or RPK is committed.
