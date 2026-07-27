import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFragments,
  EXPORT_COMPLETE
} from '../src/common/scripts/interconnectExport.js'
import {
  FRAME_PREFIX,
  parseFrames,
  reassembleFrames
} from '../tools/export-stream.mjs'

const sessionId = 'cap-export-test'
const manifest = {
  formatVersion: 'bmt-capture-v1',
  session: { id: sessionId },
  chunks: [{ index: 0 }]
}
const chunk = {
  payload: {
    formatVersion: 'bmt-capture-v1',
    sessionId,
    index: 0,
    events: []
  },
  checksum: 'fixture'
}

function complete () {
  return {
    type: EXPORT_COMPLETE,
    protocolVersion: 1,
    sessionId,
    chunkCount: 1
  }
}

function frames () {
  return [
    ...buildFragments(sessionId, 'manifest', -1, manifest),
    ...buildFragments(sessionId, 'chunk', 0, chunk),
    complete()
  ]
}

test('reassembles out-of-order frames and ignores duplicate retries', () => {
  const input = frames()
  const reordered = [input[1], input[0], input[1], ...input.slice(2)]
  const result = reassembleFrames(reordered)
  assert.equal(result.length, 1)
  assert.deepEqual(result[0].manifest, manifest)
  assert.deepEqual(result[0].chunks, [chunk])
})

test('parses stable AstroBox stdout prefix', () => {
  const log = frames()
    .map(frame => `[BmtCaptureCollector] INFO ${FRAME_PREFIX}${JSON.stringify(frame)}`)
    .join('\n')
  assert.equal(parseFrames(log).length, frames().length)
})

test('rejects missing fragments', () => {
  const large = { value: 'x'.repeat(1800) }
  const input = [
    ...buildFragments(sessionId, 'manifest', -1, large),
    complete()
  ]
  input.splice(1, 1)
  assert.throws(() => reassembleFrames(input), /frame_missing/)
})

test('rejects checksum corruption', () => {
  const input = frames()
  input[0] = { ...input[0], data: `${input[0].data}x` }
  assert.throws(() => reassembleFrames(input), /frame_length|frame_checksum/)
})

test('requires completion marker', () => {
  const input = frames().slice(0, -1)
  assert.throws(() => reassembleFrames(input), /session_incomplete/)
})
