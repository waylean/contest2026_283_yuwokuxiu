export const MAX_RACKET_SPEED_KMH = 260
export const MAX_INTENSITY_INDEX = 300
export const MAX_SHUTTLE_SPEED_KMH = 360

const MS_TO_KMH = 3.6

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

function clamp01(value) {
  return clamp(value, 0, 1)
}

function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

export function clampKmh(value, maxKmh) {
  return Math.max(0, Math.min(maxKmh, Math.round(Number(value) || 0)))
}

export function createPlayerGeometry(profile) {
  const heightCm = clamp(profile && profile.heightCm, 140, 210) || 175
  const strapIndex = clamp(profile && profile.strapIndex, 0, 2)
  const heightOffset = heightCm - 175
  const pivotToWatch = clamp(0.62 + heightOffset * 0.006, 0.5, 0.74)
  const watchToRacket = clamp(0.66 + heightOffset * 0.006, 0.54, 0.78)
  let strapSpeedFactor = 1

  if (strapIndex === 0) {
    strapSpeedFactor = 1.03
  } else if (strapIndex === 2) {
    strapSpeedFactor = 0.92
  }

  return {
    pivotToWatch,
    watchToRacket,
    strapSpeedFactor
  }
}

export function scoreSwingQuality(metrics) {
  const peakAccel = Math.max(0, Number(metrics.peakAccel) || 0)
  const peakJerk = Math.max(0, Number(metrics.peakJerk) || 0)
  const energyIntegral = Math.max(0, Number(metrics.energyIntegral) || 0)
  const burstRatio = Math.max(0, Number(metrics.burstRatio) || 0)
  const directionRatio = Math.max(0, Number(metrics.directionRatio) || 0)
  const durationMs = Math.max(0, Number(metrics.durationMs) || 0)
  const peakLatencyMs = Math.max(0, Number(metrics.peakLatencyMs) || 0)
  const halfWidthMs = Math.max(0, Number(metrics.halfWidthMs) || 0)
  const intervalMs = Math.max(20, Number(metrics.intervalMs) || 20)
  const samples = Math.max(0, Number(metrics.samples) || 0)
  const impulse = Math.max(0, Number(metrics.impulse) || 0)
  const runningLike = Boolean(metrics.runningLike)

  const peakScore = clamp01((peakAccel - 8.8) / 30) * 0.24
  const jerkScore = clamp01((peakJerk - 105) / 500) * 0.22
  const energyScore = clamp01((energyIntegral - 1.25) / 17) * 0.16
  const burstScore = clamp01((burstRatio - 1.14) / 1.35) * 0.14
  const directionScore = clamp01((directionRatio - 0.17) / 0.42) * 0.12
  const latencyScore = clamp01((280 - peakLatencyMs) / 230) * 0.07
  const widthScore = clamp01((360 - halfWidthMs) / 300) * 0.05
  const score =
    peakScore +
    jerkScore +
    energyScore +
    burstScore +
    directionScore +
    latencyScore +
    widthScore

  let reason = '有效'
  if (intervalMs > 120) reason = '采样'
  else if (samples < 3 || durationMs < 55 || durationMs > 720) reason = '时长'
  else if (peakAccel < 10.8 || (peakJerk < 130 && peakAccel < 22)) reason = '信号'
  else if (energyIntegral < 1.55 && peakAccel < 22) reason = '能量'
  else if (directionRatio < 0.12) reason = '方向'
  else if (directionRatio < 0.2 && peakAccel < 34) reason = '方向'
  else if (peakAccel >= 55 && impulse < 1.4) reason = '冲击'
  else if (peakLatencyMs > 300 && peakJerk < 330) reason = '摆臂'
  else if (durationMs > 500 && peakJerk < 390) reason = '慢摆'
  else if (halfWidthMs > 340 && peakJerk < 350) reason = '拖长'
  else if (runningLike && score < 0.76 && peakJerk < 420) reason = '跑动'
  else if (score < 0.58 && peakAccel < 30) reason = '形态'

  const accepted = reason === '有效'
  return {
    accepted,
    bestEligible: accepted && score >= 0.6 && intervalMs <= 75 && !runningLike,
    score,
    reason
  }
}

export function estimateRestitution(racketMps) {
  return clamp(1 - 0.013 * racketMps, 0.34, 0.72)
}

export function estimateSignalSpeedCeiling(
  qualityScore,
  directionRatio,
  durationMs,
  peakJerk,
  recoveredAccel
) {
  let ceiling = 155
  if (qualityScore >= 0.58 && directionRatio >= 0.24) ceiling = 180
  if (
    qualityScore >= 0.65 &&
    directionRatio >= 0.29 &&
    durationMs <= 460 &&
    peakJerk >= 270
  ) {
    ceiling = 205
  }
  if (
    qualityScore >= 0.73 &&
    directionRatio >= 0.35 &&
    durationMs <= 380 &&
    peakJerk >= 380 &&
    recoveredAccel >= 50
  ) {
    ceiling = 235
  }
  if (
    qualityScore >= 0.8 &&
    directionRatio >= 0.4 &&
    durationMs <= 350 &&
    peakJerk >= 500 &&
    recoveredAccel >= 64
  ) {
    ceiling = MAX_RACKET_SPEED_KMH
  }
  return ceiling
}

export function estimateShuttleSpeedCeiling(
  qualityScore,
  directionRatio,
  durationMs,
  peakJerk,
  recoveredAccel,
  racketKmh
) {
  let ceiling = 235
  if (
    qualityScore >= 0.65 &&
    directionRatio >= 0.29 &&
    durationMs <= 460 &&
    peakJerk >= 270
  ) {
    ceiling = 285
  }
  if (
    qualityScore >= 0.73 &&
    directionRatio >= 0.35 &&
    durationMs <= 380 &&
    peakJerk >= 380 &&
    recoveredAccel >= 50
  ) {
    ceiling = 320
  }
  if (
    qualityScore >= 0.8 &&
    directionRatio >= 0.4 &&
    durationMs <= 350 &&
    peakJerk >= 500 &&
    recoveredAccel >= 64 &&
    racketKmh >= 232
  ) {
    ceiling = MAX_SHUTTLE_SPEED_KMH
  }
  return ceiling
}

export function estimateShuttleKmh(racketMps, qualityScore, maxCap) {
  const signalQuality = clamp01(Number(qualityScore) || 0.58)
  const restitution = estimateRestitution(racketMps)
  const contactQuality = 0.78 + clamp01((signalQuality - 0.62) / 0.34) * 0.27
  const shuttleMps = racketMps * (1 + restitution) * contactQuality
  const dynamicCap =
    signalQuality >= 0.8
      ? MAX_SHUTTLE_SPEED_KMH
      : signalQuality >= 0.73
        ? 320
        : signalQuality >= 0.65
          ? 285
          : 235
  const displayCap = Math.min(
    MAX_SHUTTLE_SPEED_KMH,
    Math.max(180, Number(maxCap) || dynamicCap),
    dynamicCap
  )
  return clampKmh(Math.round(shuttleMps * MS_TO_KMH), displayCap)
}

export function estimateSwingMetrics(metrics, geometry) {
  const peakAccel = Math.max(0, Number(metrics.peakAccel) || 0)
  const peakJerk = Math.max(0, Number(metrics.peakJerk) || 0)
  const peakEnergy = Math.max(0, Number(metrics.peakEnergy) || 0)
  const impulse = Math.max(0, Number(metrics.impulse) || 0)
  const dominantImpulse = Math.max(0, Number(metrics.dominantImpulse) || 0)
  const directionRatio = Math.max(0, Number(metrics.directionRatio) || 0)
  const burstRatio = Math.max(0, Number(metrics.burstRatio) || 0)
  const energyIntegral = Math.max(0, Number(metrics.energyIntegral) || 0)
  const durationMs = Math.max(60, Number(metrics.durationMs) || 180)
  const intervalMs = Math.max(20, Number(metrics.intervalMs) || 60)
  const qualityScore = clamp01(Number(metrics.qualityScore) || 0)
  const halfInterval = Math.min(0.11, intervalMs / 2000)
  const geo = geometry || createPlayerGeometry({ heightCm: 175, strapIndex: 1 })
  const leverRatio = (geo.pivotToWatch + geo.watchToRacket) / geo.pivotToWatch
  const recoveredAccel = Math.min(125, peakAccel + peakJerk * halfInterval * 0.22)
  const circularProxy = Math.sqrt(recoveredAccel * geo.pivotToWatch)
  const impulseProxy = dominantImpulse * 0.72 + impulse * 0.28
  const wristSpeed = Math.max(circularProxy * 0.78, impulseProxy * 0.82)
  const jerkGain = Math.min(0.22, Math.max(0, (peakJerk - 155) / 980))
  const energyGain = Math.min(0.08, Math.max(0, (energyIntegral - 5) / 42))
  const burstGain = Math.min(0.08, Math.max(0, (burstRatio - 1.9) / 6))
  const compactGain = Math.min(0.08, Math.max(0, (320 - durationMs) / 1500))
  const directionGain = Math.min(0.06, Math.max(0, (directionRatio - 0.32) / 3.5))
  const distalGain = 1 + Math.min(0.2, Math.max(0, (recoveredAccel - 34) / 210))
  const qualityFactor = 0.76 + clamp01((qualityScore - 0.54) / 0.3) * 0.22
  const rawRacketKmh = Math.round(
    wristSpeed *
      leverRatio *
      (1 + jerkGain + energyGain + burstGain + compactGain + directionGain) *
      distalGain *
      geo.strapSpeedFactor *
      qualityFactor *
      MS_TO_KMH
  )
  const signalCeiling = estimateSignalSpeedCeiling(
    qualityScore,
    directionRatio,
    durationMs,
    peakJerk,
    recoveredAccel
  )
  const racketSpeedKmh = clampKmh(
    rawRacketKmh,
    Math.min(MAX_RACKET_SPEED_KMH, signalCeiling)
  )
  const racketMps = racketSpeedKmh / MS_TO_KMH
  const shuttleCeiling = estimateShuttleSpeedCeiling(
    qualityScore,
    directionRatio,
    durationMs,
    peakJerk,
    recoveredAccel,
    racketSpeedKmh
  )
  const shuttleSpeedKmh = estimateShuttleKmh(
    racketMps,
    qualityScore,
    shuttleCeiling
  )
  const confidence = Math.round(
    Math.min(
      72,
      16 +
        recoveredAccel * 0.22 +
        peakJerk * 0.014 +
        Math.min(10, energyIntegral * 0.42) +
        Math.min(5, peakEnergy * 0.018) +
        Math.min(7, directionRatio * 12) +
        qualityScore * 8
    )
  )
  let signalText = '中'
  if (confidence >= 64 && directionRatio > 0.28) signalText = '强'
  else if (confidence < 45 || directionRatio < 0.24) signalText = '弱'

  return {
    racketSpeedKmh,
    shuttleSpeedKmh,
    leverRatio: round2(leverRatio),
    restitution: round2(estimateRestitution(racketMps)),
    confidence,
    signalText,
    impulseText: round1(impulse)
  }
}

export function estimateSwingIntensityIndex(estimate, metrics) {
  const racketKmh = clampKmh(
    estimate && estimate.racketSpeedKmh,
    MAX_RACKET_SPEED_KMH
  )
  const qualityScore = clamp01(
    Number(metrics && metrics.qualityScore) ||
      (Number(estimate && estimate.confidence) || 0) / 100
  )
  const directionRatio = Math.max(0, Number(metrics && metrics.directionRatio) || 0)
  const durationMs = Math.max(80, Number(metrics && metrics.durationMs) || 360)
  let speedBase = racketKmh * 0.92
  if (racketKmh > 120 && racketKmh <= 205) {
    speedBase = 110 + Math.pow(clamp01((racketKmh - 120) / 85), 0.78) * 112
  } else if (racketKmh > 205) {
    speedBase = 222 + Math.pow(clamp01((racketKmh - 205) / 55), 0.82) * 42
  }
  const qualityBonus = clamp01((qualityScore - 0.58) / 0.3) * 22
  const directionBonus = clamp01((directionRatio - 0.26) / 0.2) * 14
  const timingBonus = clamp01((410 - durationMs) / 190) * 12
  const eliteBonus = clamp01((racketKmh - 195) / 65) * 20
  const qualityCeiling =
    qualityScore >= 0.82 && directionRatio >= 0.4 && durationMs <= 350
      ? MAX_INTENSITY_INDEX
      : qualityScore >= 0.72 && directionRatio >= 0.32 && durationMs <= 410
        ? 275
        : qualityScore >= 0.66 && directionRatio >= 0.28
          ? 255
          : 215
  return clampKmh(
    Math.round(speedBase + qualityBonus + directionBonus + timingBonus + eliteBonus),
    qualityCeiling
  )
}

export function isRecoveryReturn(current, previous) {
  if (!previous || Number(previous.peakAccel) <= 0) return false
  const elapsedMs = Number(current.at) - Number(previous.at)
  if (elapsedMs > 1050) return false

  const peakRatio =
    (Number(current.peakAccel) || 0) / Math.max(1, Number(previous.peakAccel) || 0)
  const impulseRatio =
    (Number(current.impulse) || 0) / Math.max(0.1, Number(previous.impulse) || 0)
  const speedRatio =
    (Number(current.racketSpeedKmh) || 0) /
    Math.max(1, Number(previous.racketSpeedKmh) || 0)

  if (elapsedMs < 300) return peakRatio < 1.08 && impulseRatio < 1.02
  if (elapsedMs < 850) {
    return (peakRatio < 0.76 && impulseRatio < 0.86) || speedRatio < 0.76
  }
  return peakRatio < 0.58 && impulseRatio < 0.68 && speedRatio < 0.72
}

// TEST_ONLY_BEGIN
export function evaluateSwingWindow(metrics, profile, previous) {
  const quality = scoreSwingQuality(metrics)
  if (!quality.accepted) {
    return { accepted: false, reason: quality.reason, quality }
  }
  const enriched = { ...metrics, qualityScore: quality.score }
  const estimate = estimateSwingMetrics(enriched, createPlayerGeometry(profile || {}))
  const event = {
    at: Number(metrics.at) || Date.now(),
    peakAccel: Number(metrics.peakAccel) || 0,
    impulse: Math.max(
      Number(metrics.impulse) || 0,
      Number(metrics.dominantImpulse) || 0
    ),
    racketSpeedKmh: estimate.racketSpeedKmh
  }
  if (isRecoveryReturn(event, previous)) {
    return { accepted: false, reason: '回位', quality, estimate }
  }
  return {
    accepted: true,
    reason: '有效',
    quality,
    estimate,
    intensityIndex: estimateSwingIntensityIndex(estimate, enriched),
    event
  }
}
// TEST_ONLY_END
