import assert from 'node:assert/strict'
import {
  MAX_INTENSITY_INDEX,
  MAX_RACKET_SPEED_KMH,
  MAX_SHUTTLE_SPEED_KMH,
  evaluateSwingWindow,
  scoreSwingQuality
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
