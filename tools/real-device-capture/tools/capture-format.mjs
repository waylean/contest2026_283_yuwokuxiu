import fs from 'node:fs'
import path from 'node:path'

export const FORMAT_VERSION = 'bmt-capture-v1'

export function fnv1a32 (text) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function checksum (value) {
  return fnv1a32(typeof value === 'string' ? value : JSON.stringify(value))
    .toString(16)
    .padStart(8, '0')
}

export function median (values) {
  if (!values.length) return 0
  const sorted = values.slice().sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

function addIssue (report, severity, code, message, context = {}) {
  report.issues.push({ severity, code, message, ...context })
}

function validateStages (manifest, report) {
  let lastTimestamp = Number(manifest.session?.startedAt) || 0
  for (const stage of manifest.stages || []) {
    const startedAt = Number(stage.startedAt) || 0
    const endedAt = Number(stage.endedAt) || 0
    if (startedAt < lastTimestamp) {
      addIssue(report, 'error', 'stage_time_non_monotonic',
        'Stage start time moves backwards.', { stageIndex: stage.index })
    }
    if (endedAt && endedAt < startedAt) {
      addIssue(report, 'error', 'stage_end_before_start',
        'Stage end time precedes its start.', { stageIndex: stage.index })
    }
    lastTimestamp = Math.max(lastTimestamp, startedAt, endedAt)
  }
}

function validateEventSamples (event, report, seenSequences) {
  const samples = Array.isArray(event.samples) ? event.samples : []
  const intervals = []
  let previousTime = 0
  let previousSequence = -1
  let duplicateCount = 0

  for (const sample of samples) {
    const timestamp = Number(sample.t)
    const sequence = Number(sample.seq)
    if (!Number.isFinite(timestamp) || !Number.isFinite(sequence)) {
      addIssue(report, 'error', 'invalid_sample',
        'Sample timestamp or sequence is not numeric.', { eventId: event.id })
      continue
    }
    if (previousTime && timestamp <= previousTime) {
      addIssue(report, 'error', 'sample_time_non_monotonic',
        'Sample timestamps are not strictly increasing.',
        { eventId: event.id, sequence })
    }
    if (previousSequence >= 0 && sequence <= previousSequence) {
      addIssue(report, 'error', 'sample_sequence_non_monotonic',
        'Sample sequences are not strictly increasing.',
        { eventId: event.id, sequence })
    }
    if (seenSequences.has(sequence)) duplicateCount += 1
    else seenSequences.add(sequence)
    if (previousTime && timestamp > previousTime) intervals.push(timestamp - previousTime)
    previousTime = timestamp
    previousSequence = sequence
  }

  const medianIntervalMs = median(intervals)
  const meanIntervalMs = intervals.length
    ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length
    : 0
  const sampleRateHz = medianIntervalMs > 0 ? 1000 / medianIntervalMs : 0
  const gapThresholdMs = Math.max(120, medianIntervalMs * 3)
  const gaps = intervals.filter((value) => value > gapThresholdMs)

  if (samples.length < 2) {
    addIssue(report, 'warning', 'insufficient_samples',
      'Event has fewer than two samples.', { eventId: event.id })
  } else if (sampleRateHz < 35 || sampleRateHz > 65) {
    addIssue(report, 'warning', 'sample_rate_out_of_range',
      'Median event sample rate is outside the expected game interval range.',
      { eventId: event.id, sampleRateHz })
  }
  if (gaps.length) {
    addIssue(report, 'warning', 'sample_gap',
      'Event window contains one or more sensor gaps.',
      { eventId: event.id, gapCount: gaps.length, largestGapMs: Math.max(...gaps) })
  }
  return {
    eventId: event.id,
    sampleCount: samples.length,
    medianIntervalMs,
    meanIntervalMs: Math.round(meanIntervalMs * 1000) / 1000,
    sampleRateHz: Math.round(sampleRateHz * 1000) / 1000,
    gapCount: gaps.length,
    duplicateCount
  }
}

export function mergeAndValidate (manifest, chunkRecords) {
  const report = {
    ok: true,
    formatVersion: manifest?.formatVersion,
    sessionId: manifest?.session?.id || '',
    summary: {
      manifestChunkCount: manifest?.chunks?.length || 0,
      suppliedChunkCount: chunkRecords.length,
      eventCount: 0,
      uniqueSampleCount: 0,
      duplicateSampleCount: 0,
      acceptedCount: 0,
      rejectedCount: 0
    },
    eventSampling: [],
    issues: []
  }
  const events = []
  const expectedReferences = new Map(
    (manifest?.chunks || []).map((reference) => [Number(reference.index), reference])
  )
  const seenChunkIndexes = new Set()

  if (manifest?.formatVersion !== FORMAT_VERSION) {
    addIssue(report, 'error', 'manifest_format',
      `Expected manifest format ${FORMAT_VERSION}.`)
  }
  if (!manifest?.session?.id) {
    addIssue(report, 'error', 'missing_session_id', 'Manifest has no session ID.')
  }
  validateStages(manifest || {}, report)

  const sortedChunks = chunkRecords.slice().sort((left, right) =>
    Number(left?.payload?.index) - Number(right?.payload?.index))
  for (const record of sortedChunks) {
    const payload = record?.payload
    const index = Number(payload?.index)
    if (!payload || payload.formatVersion !== FORMAT_VERSION) {
      addIssue(report, 'error', 'chunk_format', 'Chunk has an invalid format.', { index })
      continue
    }
    if (payload.sessionId !== report.sessionId) {
      addIssue(report, 'error', 'chunk_session',
        'Chunk belongs to a different session.', { index })
    }
    if (seenChunkIndexes.has(index)) {
      addIssue(report, 'error', 'duplicate_chunk', 'Chunk index is duplicated.', { index })
    }
    seenChunkIndexes.add(index)
    const actualChecksum = checksum(payload)
    if (record.checksum !== actualChecksum) {
      addIssue(report, 'error', 'chunk_checksum',
        'Chunk checksum does not match its payload.', { index })
    }
    const reference = expectedReferences.get(index)
    if (!reference) {
      addIssue(report, 'error', 'unexpected_chunk',
        'Chunk is not listed by the manifest.', { index })
    } else {
      if (reference.checksum !== record.checksum) {
        addIssue(report, 'error', 'manifest_checksum',
          'Manifest and chunk checksums differ.', { index })
      }
      if (Number(reference.eventCount) !== (payload.events || []).length) {
        addIssue(report, 'error', 'event_count',
          'Manifest event count differs from chunk payload.', { index })
      }
      if (Number(reference.serializedLength) !== JSON.stringify(record).length) {
        addIssue(report, 'error', 'serialized_length',
          'Manifest serialized length differs from chunk JSON.', { index })
      }
    }
    events.push(...(payload.events || []))
  }

  for (const [index] of expectedReferences) {
    if (!seenChunkIndexes.has(index)) {
      addIssue(report, 'error', 'missing_chunk',
        'A manifest chunk was not supplied.', { index })
    }
  }

  const seenEventIds = new Set()
  const seenSequences = new Set()
  for (const event of events) {
    if (seenEventIds.has(event.id)) {
      addIssue(report, 'error', 'duplicate_event',
        'Event ID is duplicated.', { eventId: event.id })
    }
    seenEventIds.add(event.id)
    if (Number(event.endedAt) < Number(event.startedAt)) {
      addIssue(report, 'error', 'event_time',
        'Event end time precedes its start.', { eventId: event.id })
    }
    if (typeof event.accepted !== 'boolean' || !event.reason) {
      addIssue(report, 'error', 'event_decision',
        'Event lacks accepted/rejected decision metadata.', { eventId: event.id })
    }
    if (!event.features || typeof event.qualityScore !== 'number') {
      addIssue(report, 'error', 'event_features',
        'Event lacks algorithm features or quality score.', { eventId: event.id })
    }
    const sampling = validateEventSamples(event, report, seenSequences)
    report.eventSampling.push(sampling)
    report.summary.duplicateSampleCount += sampling.duplicateCount
    if (event.accepted) report.summary.acceptedCount += 1
    else report.summary.rejectedCount += 1
  }

  report.summary.eventCount = events.length
  report.summary.uniqueSampleCount = seenSequences.size
  if (report.summary.duplicateSampleCount) {
    addIssue(report, 'warning', 'overlapping_samples',
      'Sample sequences appear in multiple event windows; JSON uniqueSamples is deduplicated.',
      { duplicateCount: report.summary.duplicateSampleCount })
  }
  report.ok = !report.issues.some((issue) => issue.severity === 'error')

  const uniqueSamples = []
  const outputSequences = new Set()
  for (const event of events) {
    for (const sample of event.samples || []) {
      if (!outputSequences.has(sample.seq)) {
        outputSequences.add(sample.seq)
        uniqueSamples.push(sample)
      }
    }
  }
  uniqueSamples.sort((left, right) => Number(left.seq) - Number(right.seq))

  return {
    manifest,
    events,
    uniqueSamples,
    validation: report
  }
}

export function readJson (file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function loadCapture (manifestFile, chunkFiles) {
  return mergeAndValidate(
    readJson(manifestFile),
    chunkFiles.map((file) => readJson(file))
  )
}

function csvValue (value) {
  const text = value === undefined || value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function eventsToCsv (events) {
  const columns = [
    'session_id', 'event_id', 'stage_index', 'stage_name', 'accepted', 'reason',
    'event_started_at', 'event_ended_at', 'quality_score', 'sample_seq',
    'sample_timestamp', 'sample_dt_ms', 'x', 'y', 'z'
  ]
  const rows = [columns.join(',')]
  for (const event of events) {
    for (const sample of event.samples || []) {
      rows.push([
        event.id?.slice(0, event.id.lastIndexOf('-e')) || '',
        event.id,
        event.stageIndex,
        event.stageName,
        event.accepted,
        event.reason,
        event.startedAt,
        event.endedAt,
        event.qualityScore,
        sample.seq,
        sample.t,
        sample.dt,
        sample.x,
        sample.y,
        sample.z
      ].map(csvValue).join(','))
    }
  }
  return `${rows.join('\n')}\n`
}

export function listChunkFiles (directory, manifestFile) {
  const manifestAbsolute = path.resolve(manifestFile)
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(directory, name))
    .filter((file) => path.resolve(file) !== manifestAbsolute)
    .sort()
}
