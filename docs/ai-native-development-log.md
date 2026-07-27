# AI-Native Development Log

## Recording policy

Each entry records the objective, AI tools, Skills or MCP tools, changed files,
human review, verification, token usage when available, and resulting commit.
Do not estimate or invent token usage.

## 2026-07-27 - Competition repository isolation

- Objective: copy the verified Xiaomi Smart Band 10 Pro standalone baseline
  without modifying the commercial or linked applications.
- AI tool: OpenAI Codex.
- Skill used: `skill-creator` guidance for the reusable competition Skill.
- Changes: competition repository structure, standalone manifest, Apache 2.0
  materials, compliance checklist, development plan, deterministic checks, and
  initial sensor replay fixture.
- Human decisions: competition scope is wearable-only; Android and phone
  interconnect are excluded; Xiaomi Smart Band 10 Pro is the only baseline.
- Verification: `npm run check`, `npm run replay`, and `npm run build` passed.
  The build produced a JSC-only RPK with protobuf disabled. The generated
  artifact remains ignored and is not part of the source submission.
- Token usage: not exposed by the current development tool; recorded as
  unavailable rather than estimated.
- Commits: `ea69288` (repository isolation) and `4b67652` (remaining
  standalone-cleanup tracking).

## 2026-07-27 - Production algorithm and graphics milestone

- Objective: remove linked-edition residue, make the actual production
  detector replayable, and expose the sensor signal through openvela graphics.
- AI tool: OpenAI Codex.
- Changes: removed phone, bridge, synthetic-session and unused raw-chunk
  storage paths; established one canonical production algorithm; added
  deterministic runtime generation; added false-positive, recovery, cap and
  monotonicity tests; added a live acceleration waveform; added automated
  336x480 emulator capture and start/stop lifecycle verification.
- Runtime issue found by emulator: local ES-module imports compiled but failed
  on the target image with `exports is not defined`. The implementation was
  changed to deterministic source inlining and revalidated.
- Verification: production replay accepted one fixture swing; JSC-only build
  passed with protobuf disabled; emulator installation, page initialization,
  horizontal navigation, four-second sampling, stop, summary write and
  seven-second post-stop survival passed. Exit, cold relaunch and history-list
  restoration also passed after allowing the emulator to finish asynchronous
  feature-instance teardown.
- Known emulator limitation: the selected generic watch image does not expose
  `service.health` or `system.brightness`. Both calls are isolated by existing
  fallbacks; Xiaomi Smart Band 10 Pro real-device verification remains a
  separate acceptance item.
- Blind review: two read-only agents independently reviewed runtime/algorithm
  risk and wearable UX/contest compliance. Fixes from review include removing
  the nonfunctional 200 ms sensor fallback, complete subscription-failure
  cleanup, accumulated-time-safe crash snapshots, cold-load history refresh,
  impact-noise rejection, warm-up-aware replay, lower snapshot write frequency,
  screenshot pixel assertions, and removal of the obsolete test page.
- Main changed files: `quickapp/bmt_smash/src/index/index.ux`,
  `quickapp/bmt_smash/src/common/scripts/competitionSwingAlgorithm.js`,
  `quickapp/bmt_smash/tools/`, `test-data/swing-replay.json`, and the architecture,
  compliance and acceptance documents.
- AI Coding ratio: exact line-level attribution is not available from the
  current tool. The milestone was AI-assisted and every generated change was
  reviewed through build, replay, emulator execution and independent blind
  review; no percentage is invented.
- MCP and Skills: reusable local Skill
  `openvela-wearable-swing`; multi-agent review tools; no external MCP data
  source was required for this milestone.
- Token usage: not exposed by the current development tool; recorded as
  unavailable rather than estimated.
- Commit: `4f73bc6`.

## 2026-07-27 - Official requirements and award-readiness audit

- Objective: reconcile the repository with the current official contest
  website, overview, watch-application guide, code-submission guide and
  AI Coding log guide.
- AI tool: OpenAI Codex with web and browser-assisted official-source review.
- Findings: the organizer-created `contest2026_<number>_<team>` repository,
  CLA, fork and pull-request flow, official `logs/` collector, September 20
  deadline and six weighted judging dimensions were not represented precisely
  enough in the previous plan.
- Changes: added the official requirement baseline, judging-readiness matrix,
  Phase 3 evidence plan and `logs/` policy; updated README, compliance,
  development and submission checklists; extended deterministic package audit
  requirements.
- Human decisions retained: Xiaomi Smart Band 10 Pro standalone remains the
  baseline; no Android linkage, new board, server or unsupported sensor claim
  is added merely for judging.
- Verification: `git diff --check`, `npm run check` and `npm run replay`
  passed. No wearable runtime behavior changed.
- Token usage: not exposed by the current development tool; recorded as
  unavailable rather than estimated.
- Commit: `5c72c81`.

## 2026-07-27 - Organizer repository migration

- Objective: migrate the accepted Xiaomi Smart Band 10 Pro standalone
  competition edition into `open-vela/contest2026_283_yuwokuxiu` without
  overwriting organizer infrastructure.
- AI tool: OpenAI Codex with the GitHub connector and local GitHub CLI.
- Changes: retained the organizer manifest and workflows; replaced unused C,
  board and Hello Quick App examples with `quickapp/bmt_smash`; mapped the
  application to `packages/apps/contest2026_283_bmt_smash`; added root build
  commands and a judge-facing Chinese README; removed example AI logs.
- Review boundary: application runtime and algorithm source were migrated
  unchanged from the accepted Phase 2 commit. Only repository paths and
  contest packaging were adapted.
- Verification: clean dependency install, package audit, production replay,
  JSC-only build and the five-screen emulator lifecycle and cold-relaunch flow
  passed in the organizer repository.
- Token usage: not exposed by the current development tool; recorded as
  unavailable rather than estimated.
- Commit: `4244183`.
