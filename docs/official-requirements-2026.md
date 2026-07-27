# 2026 openvela Contest Requirements

Verified: 2026-07-27

## Official sources

- Contest website: https://openvela.com/#/contest
- Contest overview:
  https://github.com/open-vela/docs/blob/dev-ai-contest-2026/zh-cn/contest_2026/contest_overview.md
- Watch application guide:
  https://github.com/open-vela/docs/blob/dev-ai-contest-2026/zh-cn/contest_2026/quickapp/watch_app_track_guide.md
- Code submission guide:
  https://github.com/open-vela/docs/blob/dev-ai-contest-2026/zh-cn/contest_2026/code_submission_guide.md
- AI Coding log guide:
  https://github.com/open-vela/docs/blob/dev-ai-contest-2026/zh-cn/contest_2026/ai_coding_log_guide.md

The official website and competition repository remain authoritative if these
requirements change.

## Dates and submission route

- Work submission: 2026-07-01 through 2026-09-20.
- Initial review: 2026-09-21 through 2026-09-30.
- Finalists and offline defense: October, exact date pending.
- The organizer creates one GitHub repository per team named
  `contest2026_<number>_<team>`.
- Development is submitted through fork, pull request, self-review and merge
  back to that team repository.
- Competition work uses the `dev-ai-contest-2026` branch and Apache-2.0.
- A first pull request requires the contributor to sign the openvela CLA.
- AI Coding conversations must be exported by the official collector into the
  team repository's `logs/` directory.

This repository is the organizer-created
`open-vela/contest2026_283_yuwokuxiu` repository. Changes must reach its
`dev-ai-contest-2026` branch through the official pull-request workflow.

## Required delivery

The upload package must be named:

`2026 首届 openvela AI 硬件开发者大赛 - 队伍名称 - 作品名称`

It must contain:

1. Introduction document in DOCX, PDF or PPTX form.
2. Project source and the organizer-created repository URL.
3. Demo video no longer than five minutes.
4. AI Coding logs and at least one effective reusable Skill.

The introduction must explain:

- use, optimization, extension and improvement suggestions for openvela;
- AI-Native workflow, AI Coding contribution, MCP and Skills use, and token
  consumption when available;
- target users, scenario, pain point, product innovation and experience;
- architecture, reproducible execution and evidence.

## Qualification of this project

BMT Smash is in the watch application innovation direction. It qualifies
through the openvela Quick App framework and the graphics capability, and uses
the accelerometer, optional health service, storage, brightness and router
capabilities.

For the initial round, the official watch guide allows emulator verification
and sensor Mock data. Real hardware becomes especially valuable as evidence
and can be requested for the final round. This project already owns and tests
on a Xiaomi Smart Band 10 Pro, so real-device evidence should be included in
the initial submission rather than deferred.

## Scoring

| Dimension | Weight | What judges look for |
| --- | ---: | --- |
| Technical difficulty | 30 | Architecture, deep openvela use/customization, hardware engineering and clear technical route |
| Product innovation | 20 | New scenario, accurate pain point, differentiated function and interaction |
| Completeness | 20 | Complete delivery, runnable Demo, stability, engineering quality and maintainability |
| AI development | 10 | AI throughout development and a complete, reusable Skill |
| Commercial potential | 10 | Real demand, business model, scalability, online popularity and reach |
| Presentation | 10 | Professional deck, clear demonstration and accurate defense |

## Watch-application bonus signals

- Meaningful use of wearable sensors.
- Short interaction paths and high information density.
- Refined UI and adaptation to round and square displays.
- A complete end-to-end experience that runs without a phone.

## Not applicable

The project does not need a new board, BSP, driver, server or voice wake word.
These are not general mandatory items. They should only be claimed if actually
implemented.
