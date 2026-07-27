/*
 * Diagnostic-only export transport.
 *
 * One frame is sent at a time. The original manifest/chunk JSON remains in
 * system.storage, so a failed transfer can be restarted without recollection.
 */

export const EXPORT_PROTOCOL = 'bmt_capture_fragment_v1'
export const EXPORT_COMPLETE = 'bmt_capture_complete_v1'
export const FRAGMENT_DATA_LIMIT = 700

export function fnv1a32 (text) {
  let hash = 2166136261
  for (let i = 0; i < text.length; i = i + 1) {
    hash = hash ^ text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8)
}

export function buildFragments (sessionId, category, index, record) {
  const text = typeof record === 'string' ? record : JSON.stringify(record)
  const total = Math.max(1, Math.ceil(text.length / FRAGMENT_DATA_LIMIT))
  const checksum = fnv1a32(text)
  const frames = []
  for (let part = 0; part < total; part = part + 1) {
    frames.push({
      type: EXPORT_PROTOCOL,
      protocolVersion: 1,
      sessionId: sessionId,
      category: category,
      index: index,
      part: part,
      total: total,
      payloadLength: text.length,
      checksum: checksum,
      data: text.slice(
        part * FRAGMENT_DATA_LIMIT,
        (part + 1) * FRAGMENT_DATA_LIMIT
      )
    })
  }
  return frames
}

export function createInterconnectSender (interconnect) {
  let conn = null
  let ready = false
  let active = false
  let frames = []
  let cursor = 0
  let progress = null
  let done = null

  function finish (error) {
    if (!active) return
    active = false
    const callback = done
    done = null
    frames = []
    cursor = 0
    if (typeof callback === 'function') callback(error || null)
  }

  function pump () {
    if (!active || !ready || !conn) return
    if (cursor >= frames.length) {
      finish(null)
      return
    }
    const frame = frames[cursor]
    try {
      conn.send({
        data: frame,
        success: function () {
          cursor = cursor + 1
          if (typeof progress === 'function') progress(cursor, frames.length)
          setTimeout(pump, 20)
        },
        fail: function (message, code) {
          finish('interconnect_send_fail_' + (code || 'unknown'))
        }
      })
    } catch (err) {
      finish('interconnect_send_exception')
    }
  }

  try {
    conn = interconnect && typeof interconnect.instance === 'function'
      ? interconnect.instance()
      : null
    if (conn) {
      conn.onopen = function () {
        ready = true
        pump()
      }
      conn.onclose = function () {
        ready = false
        finish('interconnect_closed')
      }
      conn.onerror = function () {
        ready = false
        finish('interconnect_error')
      }
    }
  } catch (err) {
    conn = null
  }

  return {
    available: Boolean(conn),

    sendExport: function (sessionId, manifest, chunkRecords, onProgress, onDone) {
      if (!conn) {
        if (typeof onDone === 'function') onDone('interconnect_unavailable')
        return
      }
      if (active) {
        if (typeof onDone === 'function') onDone('interconnect_busy')
        return
      }
      frames = []
      const manifestFrames = buildFragments(sessionId, 'manifest', -1, manifest)
      frames = frames.concat(manifestFrames)
      for (let i = 0; i < chunkRecords.length; i = i + 1) {
        const record = chunkRecords[i]
        const index = record && record.payload
          ? Number(record.payload.index) || 0
          : i
        frames = frames.concat(
          buildFragments(sessionId, 'chunk', index, record)
        )
      }
      frames.push({
        type: EXPORT_COMPLETE,
        protocolVersion: 1,
        sessionId: sessionId,
        chunkCount: chunkRecords.length
      })
      cursor = 0
      progress = onProgress
      done = onDone
      active = true
      pump()
    },

    close: function () {
      finish('interconnect_closed')
      conn = null
      ready = false
    }
  }
}
