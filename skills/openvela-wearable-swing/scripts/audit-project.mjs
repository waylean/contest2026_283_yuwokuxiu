import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || '.')
const manifestPath = path.join(root, 'quickapp/bmt_smash/src/manifest.json')
const pagePath = path.join(root, 'quickapp/bmt_smash/src/index/index.ux')
const required = [
  'LICENSE',
  'NOTICE',
  'THIRD_PARTY_NOTICES.md',
  'README.md',
  'docs/contest-compliance.md',
  'docs/ai-native-development-log.md',
  'docs/ai-log-privacy-audit.md',
  'docs/official-requirements-2026.md',
  'docs/judging-readiness.md',
  'docs/phase-3-plan.md',
  'submission/README.md',
  'submission/introduction-draft.md',
  'submission/demo-script.md',
  'submission/evidence-checklist.md',
  'logs/README.md',
  'skills/openvela-wearable-swing/SKILL.md',
  'quickapp/bmt_smash/src/manifest.json',
  'quickapp/bmt_smash/src/index/index.ux'
]

let failed = false
function check (condition, message) {
  if (condition) {
    console.log(`OK ${message}`)
  } else {
    failed = true
    console.error(`FAIL ${message}`)
  }
}

for (const file of required) {
  check(fs.existsSync(path.join(root, file)), `required file ${file}`)
}

if (fs.existsSync(manifestPath) && fs.existsSync(pagePath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const page = fs.readFileSync(pagePath, 'utf8')
  const features = (manifest.features || []).map((item) => item.name)

  check(manifest.config?.buildMode === 'standalone', 'standalone build mode')
  check(manifest.config?.deviceProfile === 'xiaomi-band-10-pro', '10 Pro profile')
  check(features.includes('system.sensor'), 'sensor capability declared')
  check(features.includes('system.storage'), 'storage capability declared')
  check(!features.includes('system.interconnect'), 'interconnect capability excluded')
  check(!page.includes("@system.interconnect"), 'interconnect runtime code excluded')
  check(!page.includes('controlLinkStatus'), 'phone status UI excluded')
  check(page.includes("const HEART_RATE_MODE = 'poll'"), 'safe heart-rate mode')
}

const forbiddenExtensions = new Set(['.apk', '.rpk', '.abp', '.keystore', '.pem'])
function walk (dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' ||
        entry.name === 'build' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else {
      check(!forbiddenExtensions.has(path.extname(entry.name).toLowerCase()),
        `no forbidden artifact ${path.relative(root, full)}`)
    }
  }
}
walk(root)

if (failed) process.exitCode = 1
