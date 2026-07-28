import {
  createAdaptiveThresholds,
  evaluateSwingWindow,
  updateNoiseEstimate
} from '../src/common/scripts/competitionSwingAlgorithm.js'

const GRAVITY = 9.80665

export function evaluateTrace(
  samples,
  intervalMs,
  warmupSamples = 0,
  profile = {},
  warmupVector = [0, 0, GRAVITY]
) {
  const warmup = Array.from(
    { length: Math.max(0, Number(warmupSamples) || 0) },
    () => warmupVector.slice(0, 3)
  )
  const rows = preprocessSamples(warmup.concat(samples), intervalMs)
  const windows = findSwingWindows(rows, intervalMs)
  const results = []
  let previousEvent = null

  windows.forEach((window, index) => {
    const result = evaluateSwingWindow(
      {
        ...summarizeWindow(window, intervalMs),
        at: 1000 + index * 1000
      },
      profile,
      previousEvent
    )
    results.push(result)
    if (result.accepted) previousEvent = result.event
  })
  return { rows, windows, results }
}

export function preprocessSamples(samples, intervalMs) {
  let gravityReady = false
  let gravityX = 0
  let gravityY = 0
  let gravityZ = GRAVITY
  let lastMagnitude = 0
  let lastDynX = 0
  let lastDynY = 0
  let lastDynZ = 0

  return samples.map((sample, index) => {
    const x = Number(sample[0]) || 0
    const y = Number(sample[1]) || 0
    const z = Number(sample[2]) || 0
    const dt = Math.min(0.08, intervalMs / 1000)
    const gravityAlpha = dt / (0.82 + dt)

    if (!gravityReady) {
      gravityX = x
      gravityY = y
      gravityZ = z
      gravityReady = true
    } else {
      gravityX = gravityX * (1 - gravityAlpha) + x * gravityAlpha
      gravityY = gravityY * (1 - gravityAlpha) + y * gravityAlpha
      gravityZ = gravityZ * (1 - gravityAlpha) + z * gravityAlpha
    }

    const dynX = x - gravityX
    const dynY = y - gravityY
    const dynZ = z - gravityZ
    const magnitude = Math.sqrt(x * x + y * y + z * z)
    const dynMotionAccel = Math.sqrt(dynX * dynX + dynY * dynY + dynZ * dynZ)
    const rawMotionAccel = Math.max(0, Math.abs(magnitude - GRAVITY))
    const motionAccel = Math.max(dynMotionAccel, rawMotionAccel * 0.82)
    const dynJerk =
      Math.sqrt(
        Math.pow(dynX - lastDynX, 2) +
          Math.pow(dynY - lastDynY, 2) +
          Math.pow(dynZ - lastDynZ, 2)
      ) / dt
    const rawJerk = Math.abs(magnitude - lastMagnitude) / dt
    const jerk = Math.max(dynJerk, rawJerk * 0.8)

    lastMagnitude = magnitude
    lastDynX = dynX
    lastDynY = dynY
    lastDynZ = dynZ
    return {
      at: index * intervalMs,
      dynX,
      dynY,
      dynZ,
      motionAccel,
      jerk
    }
  })
}

export function findSwingWindows(rows, intervalMs) {
  const windows = []
  let activeWindow = null
  let quietSamples = 0
  const noiseBaseline = {
    accel: 0,
    jerk: 0,
    samples: 0,
    quietSamples: 0
  }

  for (const row of rows) {
    updateNoiseEstimate(
      noiseBaseline,
      row.motionAccel,
      row.jerk,
      Boolean(activeWindow)
    )
    const threshold = createAdaptiveThresholds(
      noiseBaseline.accel,
      noiseBaseline.jerk,
      intervalMs
    )
    const isActive =
      row.motionAccel > threshold.activeAccel ||
      row.jerk > threshold.activeJerk
    const starts =
      (
        row.motionAccel > threshold.startAccel &&
        row.jerk > threshold.startJerk
      ) ||
      row.motionAccel > threshold.hardStartAccel

    if (!activeWindow && starts) {
      activeWindow = [row]
      quietSamples = 0
      continue
    }
    if (!activeWindow) continue

    activeWindow.push(row)
    quietSamples = isActive ? 0 : quietSamples + 1
    const duration =
      activeWindow[activeWindow.length - 1].at - activeWindow[0].at
    if (duration > 640 || quietSamples >= 5) {
      windows.push(activeWindow)
      activeWindow = null
      quietSamples = 0
    }
  }

  if (activeWindow && activeWindow.length >= 3) windows.push(activeWindow)
  return windows
}

export function summarizeWindow(rows, intervalMs) {
  const dt = intervalMs / 1000
  let peakAccel = 0
  let peakJerk = 0
  let peakAt = rows[0].at
  let accelSum = 0
  let accelSquareSum = 0
  let impulse = 0
  let highSamples = 0
  let posX = 0
  let negX = 0
  let posY = 0
  let negY = 0
  let posZ = 0
  let negZ = 0

  for (const row of rows) {
    if (row.motionAccel > peakAccel) {
      peakAccel = row.motionAccel
      peakAt = row.at
    }
    peakJerk = Math.max(peakJerk, row.jerk)
    accelSum += row.motionAccel
    accelSquareSum += row.motionAccel * row.motionAccel
    impulse += row.motionAccel * dt
    if (row.motionAccel > Math.max(3.2, peakAccel * 0.46)) highSamples += 1
    if (row.dynX >= 0) posX += row.dynX * dt
    else negX -= row.dynX * dt
    if (row.dynY >= 0) posY += row.dynY * dt
    else negY -= row.dynY * dt
    if (row.dynZ >= 0) posZ += row.dynZ * dt
    else negZ -= row.dynZ * dt
  }

  const avgAccel = accelSum / rows.length
  const dominantImpulse = Math.max(posX, negX, posY, negY, posZ, negZ)
  return {
    peakAccel,
    peakJerk,
    peakEnergy: peakAccel * peakAccel,
    avgAccel,
    impulse,
    dominantImpulse,
    directionX: posX - negX,
    directionY: posY - negY,
    directionZ: posZ - negZ,
    directionRatio: dominantImpulse / Math.max(0.1, impulse),
    burstRatio: peakAccel / Math.max(1.2, avgAccel),
    energyIntegral: accelSquareSum * Math.min(0.08, dt),
    durationMs: Math.max(
      60,
      rows[rows.length - 1].at - rows[0].at + intervalMs
    ),
    peakLatencyMs: peakAt - rows[0].at,
    halfWidthMs: highSamples * intervalMs,
    intervalMs,
    samples: rows.length
  }
}
