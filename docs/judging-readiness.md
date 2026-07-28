# Judging Readiness

Date: 2026-07-28

This is an internal readiness estimate, not an official score.

## Current position

| Dimension | Current evidence | Main gap | Readiness |
| --- | --- | --- | --- |
| Technical difficulty, 30 | Adaptive accelerometer pipeline, direction-aware recovery, impact filtering and deterministic property tests | No authoritative labeled field dataset or deep openvela upstream contribution | Medium-strong |
| Product innovation, 20 | Wrist-only badminton training, history, scoring, optional heart rate, real users | Differentiation is not yet expressed as measurable product outcomes | Strong |
| Completeness, 20 | Clean remote checkout, JSC build, emulator lifecycle, cold history restore, isolated standalone source | No CI or final delivery package | Medium-strong |
| AI development, 10 | Reusable Skill, official validated log, blind review workflow, verified collector and privacy audit | More contest-only sessions and measured workflow summary are still useful | Strong |
| Commercial potential, 10 | Existing paid users and public demand | Evidence is not anonymized, summarized or connected to a scalable plan | Strong but undocumented |
| Presentation, 10 | Emulator screenshots and a timed Demo script | No final Demo, deck or rehearsed defense | Medium-low |

## Award target

The most natural target is the watch application innovation award. A top-three
overall result requires the submission to stop looking like a collection of
fixed thresholds and demonstrate:

1. Defensible, explainable signal processing with explicit claim boundaries.
2. Clear technical depth in on-device signal processing and openvela use.
3. A stable, reproducible and maintainable engineering package.
4. Credible user and commercial evidence.
5. A concise live story that judges can understand within two minutes.

## Highest-return improvements

### 1. Replace accuracy claims with algorithm properties

Show what can be proved without an authoritative field dataset: axis/sign
transformation robustness, amplitude monotonicity, callback-interval tolerance,
impact rejection, direction-aware recovery and physical caps. Do not translate
these checks into precision, recall or radar-equivalent accuracy.

### 2. Keep a hybrid detector as future work

Retain deterministic physical gates for safety and explainability. Evaluate a
small on-device classifier over the existing feature vector only if labeled
data proves that it improves precision or recall. Keep the current rule engine
as a fallback. Do not add an "AI" label without comparative results.

### 3. Show openvela engineering depth

- Use the official simulator sensor Mock path for deterministic scenarios.
- Document each openvela capability, failure mode and fallback.
- Demonstrate lifecycle cleanup and storage recovery through deterministic
  emulator scenarios.
- Submit a useful documentation fix, reproducible issue or small upstream
  improvement if one is discovered. An upstream contribution is stronger
  evidence than merely listing APIs.

### 4. Turn existing adoption into evidence

Prepare an anonymized one-page product validation summary:

- more than 1,000 purchasers, with source and date;
- supported devices and active feedback channels;
- top user requests and defects resolved;
- privacy-respecting screenshots or aggregate feedback;
- realistic distribution and maintenance plan.

### 5. Rehearse a failure-safe demonstration

Prepare one live device, one prerecorded real-device segment, emulator
screenshots and a locally reproducible build. The Demo must still succeed if
heart-rate service, sensor subscription or live projection fails.

## Claims policy

- "Swing intensity" and "estimated shuttle speed" are training estimates.
- Heart rate is wellness feedback, not medical measurement.
- Emulator sensor data is synthetic and must be labeled as such.
- Only results measured on a documented dataset may be presented as accuracy.
