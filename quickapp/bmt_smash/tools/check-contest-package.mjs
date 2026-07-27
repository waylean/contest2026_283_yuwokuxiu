import childProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const wearableRoot = path.resolve(new URL('..', import.meta.url).pathname)
const repositoryRoot = path.resolve(wearableRoot, '../..')
const required = [
  'LICENSE',
  'NOTICE',
  'THIRD_PARTY_NOTICES.md',
  'README.md',
  'docs/contest-compliance.md',
  'docs/development-plan.md',
  'docs/ai-native-development-log.md',
  'docs/official-requirements-2026.md',
  'docs/judging-readiness.md',
  'docs/phase-3-plan.md',
  'docs/submission-checklist.md',
  'logs/README.md',
  'skills/openvela-wearable-swing/SKILL.md'
]

let failed = false
for (const file of required) {
  if (!fs.existsSync(path.join(repositoryRoot, file))) {
    failed = true
    console.error(`FAIL missing ${file}`)
  }
}

try {
  const branch = childProcess.execFileSync('git', ['branch', '--show-current'], {
    cwd: repositoryRoot,
    encoding: 'utf8'
  }).trim()
  const allowed =
    branch === 'dev-ai-contest-2026' || branch.startsWith('agent/')
  if (!allowed) {
    failed = true
    console.error(
      `FAIL branch=${branch || '(none)'}, expected dev-ai-contest-2026 or agent/*`
    )
  } else {
    console.log(`OK branch=${branch}`)
  }
} catch (err) {
  failed = true
  console.error('FAIL repository is not initialized')
}

if (failed) process.exitCode = 1
else console.log('OK contest package metadata')
