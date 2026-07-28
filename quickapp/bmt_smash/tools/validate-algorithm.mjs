import assert from 'node:assert/strict'
import {
  MAX_INTENSITY_INDEX,
  MAX_RACKET_SPEED_KMH,
  MAX_SHUTTLE_SPEED_KMH,
  createAdaptiveThresholds,
  evaluateSwingWindow,
  isRecoveryReturn,
  scoreSwingQuality,
  updateNoiseEstimate
} from '../src/common/scripts/competitionSwingAlgorithm.js'

const profile = { heightCm: 175, strapIndex: 1 }

const fixtures = {
  rest: {
    peakAccel: 2,
    peakJerk: 20,
    energyIntegral: 0.2,
    burstRatio: 1.1,
    directionRatio: 0.2,
    durationMs: 200,
    peakLatencyMs: 100,
    halfWidthMs: 100,
    intervalMs: 20,
    samples: 10
  },
  casualArmMotion: {
    peakAccel: 18,
    peakJerk: 180,
    energyIntegral: 3,
    burstRatio: 1.5,
    directionRatio: 0.18,
    durationMs: 560,
    peakLatencyMs: 340,
    halfWidthMs: 360,
    intervalMs: 20,
    samples: 20
  },
  runningPeriodic: {
    peakAccel: 26,
    peakJerk: 250,
    energyIntegral: 6,
    burstRatio: 1.8,
    directionRatio: 0.3,
    durationMs: 360,
    peakLatencyMs: 170,
    halfWidthMs: 210,
    intervalMs: 20,
    samples: 18,
    runningLike: true
  },
  drive: {
    peakAccel: 42,
    peakJerk: 430,
    peakEnergy: 1300,
    energyIntegral: 12,
    burstRatio: 2.3,
    directionRatio: 0.4,
    durationMs: 320,
    peakLatencyMs: 125,
    halfWidthMs: 170,
    intervalMs: 20,
    samples: 16,
    impulse: 12,
    dominantImpulse: 7,
    at: 10000
  },
  smash: {
    peakAccel: 86,
    peakJerk: 760,
    peakEnergy: 3500,
    energyIntegral: 28,
    burstRatio: 3.2,
    directionRatio: 0.56,
    durationMs: 245,
    peakLatencyMs: 105,
    halfWidthMs: 120,
    intervalMs: 20,
    samples: 12,
    impulse: 22,
    dominantImpulse: 14,
    at: 20000
  },
  elite: {
    peakAccel: 124,
    peakJerk: 1300,
    peakEnergy: 9000,
    energyIntegral: 48,
    burstRatio: 4.2,
    directionRatio: 0.72,
    durationMs: 210,
    peakLatencyMs: 85,
    halfWidthMs: 95,
    intervalMs: 20,
    samples: 11,
    impulse: 45,
    dominantImpulse: 31,
    at: 30000
  }
}

assert.equal(scoreSwingQuality(fixtures.rest).accepted, false, 'rest must not count')
assert.equal(
  scoreSwingQuality(fixtures.casualArmMotion).accepted,
  false,
  'casual arm motion must not count'
)
assert.equal(
  scoreSwingQuality(fixtures.runningPeriodic).accepted,
  false,
  'periodic running-like motion must not count'
)

const drive = evaluateSwingWindow(fixtures.drive, profile)
const smash = evaluateSwingWindow(fixtures.smash, profile)
const elite = evaluateSwingWindow(fixtures.elite, profile)

assert.equal(drive.accepted, true, 'drive window should be accepted')
assert.equal(smash.accepted, true, 'smash window should be accepted')
assert.equal(elite.accepted, true, 'elite window should be accepted')
assert.ok(
  drive.intensityIndex < smash.intensityIndex &&
    smash.intensityIndex < elite.intensityIndex,
  'intensity must remain monotonic across stronger valid windows'
)

for (const result of [drive, smash, elite]) {
  assert.ok(
    result.estimate.racketSpeedKmh <= MAX_RACKET_SPEED_KMH,
    'racket speed cap exceeded'
  )
  assert.ok(
    result.estimate.shuttleSpeedKmh <= MAX_SHUTTLE_SPEED_KMH,
    'shuttle speed cap exceeded'
  )
  assert.ok(
    result.intensityIndex <= MAX_INTENSITY_INDEX,
    'intensity cap exceeded'
  )
}

const recovery = evaluateSwingWindow(
  {
    ...fixtures.drive,
    at: fixtures.smash.at + 520,
    peakAccel: fixtures.smash.peakAccel * 0.62,
    peakJerk: fixtures.smash.peakJerk * 0.55,
    impulse: fixtures.smash.impulse * 0.54,
    dominantImpulse: fixtures.smash.dominantImpulse * 0.54
  },
  profile,
  smash.event
)
assert.equal(recovery.accepted, false, 'post-hit recovery must be filtered')
assert.equal(recovery.reason, '回位', 'recovery must report the expected reason')

const quietThresholds = createAdaptiveThresholds(0.2, 4, 20)
const noisyThresholds = createAdaptiveThresholds(2.2, 34, 20)
const cappedThresholds = createAdaptiveThresholds(20, 800, 20)
assert.ok(
  noisyThresholds.startAccel > quietThresholds.startAccel &&
    noisyThresholds.startJerk > quietThresholds.startJerk,
  'sustained baseline noise must raise candidate thresholds'
)
assert.ok(
  cappedThresholds.startAccel <= 13.2 &&
    cappedThresholds.startJerk <= 220 &&
    cappedThresholds.hardStartAccel <= 18.5,
  'adaptive thresholds must remain inside conservative caps'
)

const learnedNoise = { accel: 0, jerk: 0, samples: 0, quietSamples: 0 }
for (let index = 0; index < 24; index += 1) {
  updateNoiseEstimate(learnedNoise, 1.2, 18, false)
}
assert.equal(
  learnedNoise.samples,
  0,
  'noise baseline must require a sustained quiet interval'
)
updateNoiseEstimate(learnedNoise, 1.2, 18, false)
assert.equal(learnedNoise.samples, 1, 'quiet baseline must start after 25 samples')
const stableNoise = {
  accel: learnedNoise.accel,
  jerk: learnedNoise.jerk,
  samples: learnedNoise.samples
}
for (let index = 0; index < 100; index += 1) {
  updateNoiseEstimate(learnedNoise, 3.2, 45, false)
}
assert.deepEqual(
  {
    accel: learnedNoise.accel,
    jerk: learnedNoise.jerk,
    samples: learnedNoise.samples
  },
  stableNoise,
  'slow arm motion above the quiet envelope must not contaminate baseline'
)

const previousDirectional = {
  at: 40000,
  peakAccel: 80,
  impulse: 20,
  racketSpeedKmh: 210,
  directionVector: { x: 12, y: 2, z: 1 }
}
const rapidSameDirection = {
  at: 40260,
  peakAccel: 77,
  impulse: 19,
  racketSpeedKmh: 205,
  directionVector: { x: 10, y: 2, z: 1 }
}
const weakerOppositeReturn = {
  at: 40520,
  peakAccel: 55,
  impulse: 14,
  racketSpeedKmh: 145,
  directionVector: { x: -9, y: -1, z: 0 }
}
const weakerSameDirection = {
  at: 40520,
  peakAccel: 46,
  impulse: 12,
  racketSpeedKmh: 125,
  directionVector: { x: 8, y: 1, z: 0 }
}
const strongOppositeRally = {
  at: 40260,
  peakAccel: 78,
  impulse: 19.5,
  racketSpeedKmh: 208,
  directionVector: { x: -11, y: -2, z: -1 }
}
assert.equal(
  isRecoveryReturn(rapidSameDirection, previousDirectional),
  false,
  'rapid same-direction rally swing must not be rejected as recovery'
)
assert.equal(
  isRecoveryReturn(weakerOppositeReturn, previousDirectional),
  true,
  'weaker opposite-direction return must be filtered'
)
assert.equal(
  isRecoveryReturn(weakerSameDirection, previousDirectional),
  false,
  'a weaker same-direction rally swing must not be rejected solely by amplitude'
)
assert.equal(
  isRecoveryReturn(strongOppositeRally, previousDirectional),
  false,
  'a strong opposite-direction rally swing must not be rejected solely by direction'
)

const poorDirectionExtreme = scoreSwingQuality({
  ...fixtures.elite,
  directionRatio: 0.08
})
assert.equal(
  poorDirectionExtreme.accepted,
  false,
  'very strong but directionless impact must not count'
)
const compactImpact = scoreSwingQuality({
  ...fixtures.elite,
  directionRatio: 0.7,
  impulse: 0.8
})
assert.equal(
  compactImpact.accepted,
  false,
  'high peak with insufficient impulse must be treated as impact noise'
)

console.log(
  `OK production algorithm: drive=${drive.intensityIndex}, smash=${smash.intensityIndex}, elite=${elite.intensityIndex}`
)
console.log('OK false-positive, recovery, monotonicity and physical caps')
