import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { evaluateTrace } from './sensor-replay-core.mjs'

const wearableRoot = path.resolve(new URL('..', import.meta.url).pathname)
const fixturePath = path.resolve(
  wearableRoot,
  '../../test-data/swing-replay.json'
)
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
const profile = { heightCm: 175, strapIndex: 1 }

function accepted(trace) {
  return trace.results.filter((result) => result.accepted)
}

function transformAxes(samples) {
  return samples.map(([x, y, z]) => [-z, x, -y])
}

function scaleDynamic(samples, factor) {
  const gravity = 9.80665
  return samples.map(([x, y, z]) => [
    x * factor,
    y * factor,
    gravity + (z - gravity) * factor
  ])
}

const base = evaluateTrace(
  fixture.samples,
  fixture.intervalMs,
  fixture.warmupSamples,
  profile
)
const rotated = evaluateTrace(
  transformAxes(fixture.samples),
  fixture.intervalMs,
  fixture.warmupSamples,
  profile,
  transformAxes([[0, 0, 9.80665]])[0]
)
const weaker = evaluateTrace(
  scaleDynamic(fixture.samples, 0.76),
  fixture.intervalMs,
  fixture.warmupSamples,
  profile
)
const stronger = evaluateTrace(
  scaleDynamic(fixture.samples, 1.3),
  fixture.intervalMs,
  fixture.warmupSamples,
  profile
)

assert.equal(accepted(base).length, 1, 'base trace must contain one valid swing')
assert.equal(
  accepted(rotated).length,
  accepted(base).length,
  'axis permutation and sign changes must preserve detection count'
)
assert.ok(
  Math.abs(
    accepted(rotated)[0].intensityIndex - accepted(base)[0].intensityIndex
  ) <= 2,
  'axis permutation and sign changes must preserve intensity'
)
assert.ok(
  accepted(weaker).length === 0 ||
    accepted(weaker)[0].intensityIndex <= accepted(base)[0].intensityIndex,
  'weaker dynamic amplitude must not increase intensity'
)
assert.ok(
  accepted(stronger).length === 1 &&
    accepted(stronger)[0].intensityIndex >= accepted(base)[0].intensityIndex,
  'stronger valid amplitude must not reduce intensity'
)

const interval20 = accepted(
  evaluateTrace(fixture.samples, 20, fixture.warmupSamples, profile)
)
const interval30 = accepted(
  evaluateTrace(fixture.samples, 30, fixture.warmupSamples, profile)
)
assert.equal(interval20.length, 1, '20 ms trace must remain detectable')
assert.equal(interval30.length, 1, '30 ms trace must remain detectable')
assert.ok(
  Math.abs(interval20[0].intensityIndex - interval30[0].intensityIndex) <= 35,
  'reasonable callback variation must not cause an intensity discontinuity'
)

const isolatedImpact = evaluateTrace(
  [
    [0, 0, 9.80665],
    [0, 0, 9.80665],
    [70, 0, 9.80665],
    [0, 0, 9.80665],
    [0, 0, 9.80665],
    [0, 0, 9.80665],
    [0, 0, 9.80665]
  ],
  20,
  80,
  profile
)
assert.equal(
  accepted(isolatedImpact).length,
  0,
  'single-sample impact must not be counted as a swing'
)

for (const intervalMs of [20, 30, 50]) {
  for (const peak of [30, 42, 55, 70]) {
    const pulse = evaluateTrace(
      [
        [0, 0, 9.80665],
        [0, 0, 9.80665],
        [peak, 0, 9.80665],
        [0, 0, 9.80665],
        [0, 0, 9.80665],
        [0, 0, 9.80665],
        [0, 0, 9.80665]
      ],
      intervalMs,
      80,
      profile
    )
    assert.equal(
      accepted(pulse).length,
      0,
      `single impact peak=${peak}, interval=${intervalMs} must be rejected`
    )
  }
}

for (const intervalMs of [20, 30, 40, 50]) {
  for (const peak of [42, 55, 70]) {
    const pulse = evaluateTrace(
      [
        [0, 0, 9.80665],
        [0, 0, 9.80665],
        [peak, 0, 9.80665],
        [peak, 0, 9.80665],
        [0, 0, 9.80665],
        [0, 0, 9.80665],
        [0, 0, 9.80665]
      ],
      intervalMs,
      80,
      profile
    )
    assert.equal(
      accepted(pulse).length,
      0,
      `double impact peak=${peak}, interval=${intervalMs} must be rejected`
    )
  }
}

const idleJitter = Array.from({ length: 320 }, (_, index) => [
  Math.sin(index * 0.37) * 0.18,
  Math.cos(index * 0.29) * 0.14,
  9.80665 + Math.sin(index * 0.21) * 0.22
])
assert.equal(
  accepted(evaluateTrace(idleJitter, 20, 80, profile)).length,
  0,
  'bounded idle sensor jitter must not create a swing'
)

const periodicArmMotion = Array.from({ length: 420 }, (_, index) => {
  const phase = index * 0.12
  return [
    Math.sin(phase) * 2.7,
    Math.cos(phase * 0.55) * 1.1,
    9.80665 + Math.cos(phase) * 1.8
  ]
})
assert.equal(
  accepted(evaluateTrace(periodicArmMotion, 20, 80, profile)).length,
  0,
  'periodic walking or casual arm motion must not create a swing'
)

console.log(
  'OK algorithm properties: axes, amplitude, callback interval and adversarial traces'
)
