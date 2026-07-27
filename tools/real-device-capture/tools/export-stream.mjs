import { checksum } from './capture-format.mjs'

export const FRAME_PREFIX = 'BMT_CAPTURE_FRAME '
export const FRAME_TYPE = 'bmt_capture_fragment_v1'
export const COMPLETE_TYPE = 'bmt_capture_complete_v1'

function frameFromLine (line) {
  const marker = line.indexOf(FRAME_PREFIX)
  if (marker < 0) return null
  const raw = line.slice(marker + FRAME_PREFIX.length).trim()
  let value
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('frame_json_invalid')
  }
  if (typeof value === 'string') value = JSON.parse(value)
  if (value?.data?.type && !value.type) value = value.data
  return value
}

export function parseFrames (logText) {
  return String(logText)
    .split(/\r?\n/)
    .map(frameFromLine)
    .filter(Boolean)
}

export function reassembleFrames (frames) {
  const groups = new Map()
  const completedSessions = new Map()

  for (const frame of frames) {
    if (frame.type === COMPLETE_TYPE) {
      completedSessions.set(frame.sessionId, Number(frame.chunkCount) || 0)
      continue
    }
    if (frame.type !== FRAME_TYPE) continue
    const key = [
      frame.sessionId,
      frame.category,
      Number(frame.index)
    ].join('|')
    let group = groups.get(key)
    if (!group) {
      group = {
        sessionId: frame.sessionId,
        category: frame.category,
        index: Number(frame.index),
        total: Number(frame.total),
        payloadLength: Number(frame.payloadLength),
        checksum: frame.checksum,
        parts: new Map()
      }
      groups.set(key, group)
    }
    if (group.total !== Number(frame.total) ||
        group.checksum !== frame.checksum ||
        group.payloadLength !== Number(frame.payloadLength)) {
      throw new Error(`frame_metadata_conflict:${key}`)
    }
    const part = Number(frame.part)
    if (part < 0 || part >= group.total) {
      throw new Error(`frame_part_out_of_range:${key}:${part}`)
    }
    const existing = group.parts.get(part)
    if (existing !== undefined && existing !== frame.data) {
      throw new Error(`frame_duplicate_conflict:${key}:${part}`)
    }
    group.parts.set(part, frame.data)
  }

  const sessions = new Map()
  for (const group of groups.values()) {
    if (group.parts.size !== group.total) {
      throw new Error(
        `frame_missing:${group.sessionId}:${group.category}:${group.index}`
      )
    }
    let text = ''
    for (let part = 0; part < group.total; part += 1) {
      if (!group.parts.has(part)) {
        throw new Error(
          `frame_missing:${group.sessionId}:${group.category}:${group.index}:${part}`
        )
      }
      text += group.parts.get(part)
    }
    if (text.length !== group.payloadLength) {
      throw new Error(
        `frame_length:${group.sessionId}:${group.category}:${group.index}`
      )
    }
    if (checksum(text) !== group.checksum) {
      throw new Error(
        `frame_checksum:${group.sessionId}:${group.category}:${group.index}`
      )
    }
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error(
        `payload_json_invalid:${group.sessionId}:${group.category}:${group.index}`
      )
    }
    let session = sessions.get(group.sessionId)
    if (!session) {
      session = { sessionId: group.sessionId, manifest: null, chunks: [] }
      sessions.set(group.sessionId, session)
    }
    if (group.category === 'manifest') session.manifest = parsed
    else if (group.category === 'chunk') session.chunks.push(parsed)
  }

  for (const session of sessions.values()) {
    if (!completedSessions.has(session.sessionId)) {
      throw new Error(`session_incomplete:${session.sessionId}`)
    }
    if (!session.manifest) {
      throw new Error(`manifest_missing:${session.sessionId}`)
    }
    session.chunks.sort(
      (left, right) => Number(left?.payload?.index) - Number(right?.payload?.index)
    )
    const expected = completedSessions.get(session.sessionId)
    if (session.chunks.length !== expected) {
      throw new Error(
        `chunk_count:${session.sessionId}:${session.chunks.length}:${expected}`
      )
    }
  }
  return [...sessions.values()]
}
