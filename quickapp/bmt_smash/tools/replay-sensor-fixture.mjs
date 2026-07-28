import fs from 'node:fs'
import path from 'node:path'
import { evaluateTrace } from './sensor-replay-core.mjs'

const wearableRoot = path.resolve(new URL('..', import.meta.url).pathname)
const fixturePath = path.resolve(
  wearableRoot,
  '../../test-data/swing-replay.json'
)
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
const trace = evaluateTrace(
  fixture.samples,
  fixture.intervalMs,
  fixture.warmupSamples,
  { heightCm: 175, strapIndex: 1 }
)
const accepted = trace.results.filter((result) => result.accepted)
const min = fixture.expected.minimumSwings
const max = fixture.expected.maximumSwings

if (accepted.length < min || accepted.length > max) {
  console.error(
    `FAIL replay accepted=${accepted.length}, ` +
    `expected=${min}..${max}, windows=${trace.windows.length}`
  )
  process.exitCode = 1
} else {
  const intensity = accepted[0] ? accepted[0].intensityIndex : 0
  const shuttle = accepted[0] ? accepted[0].estimate.shuttleSpeedKmh : 0
  console.log(
    `OK production replay accepted=${accepted.length}, ` +
    `intensity=${intensity}, shuttle=${shuttle}km/h`
  )
}
