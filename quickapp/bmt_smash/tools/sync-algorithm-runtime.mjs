import fs from 'node:fs'
import path from 'node:path'

const wearableRoot = path.resolve(new URL('..', import.meta.url).pathname)
const algorithmPath = path.join(
  wearableRoot,
  'src',
  'common',
  'scripts',
  'competitionSwingAlgorithm.js'
)
const pagePath = path.join(wearableRoot, 'src', 'index', 'index.ux')
const beginMarker = '  // BEGIN GENERATED COMPETITION SWING ALGORITHM'
const endMarker = '  // END GENERATED COMPETITION SWING ALGORITHM'
const checkOnly = process.argv.includes('--check')

const algorithm = fs
  .readFileSync(algorithmPath, 'utf8')
  .replace(/\/\/ TEST_ONLY_BEGIN[\s\S]*?\/\/ TEST_ONLY_END/g, '')
  .replace(/^export\s+/gm, '')
  .trim()
const aliases = [
  'const calculateRestitution = estimateRestitution',
  'const calculateShuttleKmh = estimateShuttleKmh',
  'const calculateShuttleSpeedCeiling = estimateShuttleSpeedCeiling',
  'const calculateSignalSpeedCeiling = estimateSignalSpeedCeiling',
  'const calculateSwingIntensityIndex = estimateSwingIntensityIndex',
  'const calculateSwingMetrics = estimateSwingMetrics',
  'const evaluateRecoveryReturn = isRecoveryReturn',
  'const evaluateSwingQuality = scoreSwingQuality'
].join('\n')
const generated = `${algorithm}\n\n${aliases}`
  .split('\n')
  .map((line) => (line ? `  ${line}` : ''))
  .join('\n')

const page = fs.readFileSync(pagePath, 'utf8')
const begin = page.indexOf(beginMarker)
const end = page.indexOf(endMarker)
if (begin < 0 || end < 0 || end <= begin) {
  throw new Error('Algorithm runtime markers are missing or invalid')
}

const expected =
  page.slice(0, begin + beginMarker.length) +
  `\n${generated}\n` +
  page.slice(end)

if (checkOnly) {
  if (page !== expected) {
    console.error('FAIL generated competition algorithm runtime is stale')
    process.exitCode = 1
  } else {
    console.log('OK generated competition algorithm runtime matches source')
  }
} else if (page !== expected) {
  fs.writeFileSync(pagePath, expected)
  console.log('Updated generated competition algorithm runtime')
} else {
  console.log('Competition algorithm runtime already current')
}
