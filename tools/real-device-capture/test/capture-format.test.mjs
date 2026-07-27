import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  checksum,
  eventsToCsv,
  loadCapture,
  mergeAndValidate,
  readJson
} from '../tools/capture-format.mjs'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const fixtureRoot = path.join(root, 'test/fixtures')
const manifestFile = path.join(fixtureRoot, 'manifest.json')
const chunkFile = path.join(fixtureRoot, 'chunks/chunk-000.json')

test('valid anonymous fixture passes integrity and sampling checks', () => {
  const merged = loadCapture(manifestFile, [chunkFile])
  assert.equal(merged.validation.ok, true)
  assert.equal(merged.validation.summary.eventCount, 1)
  assert.equal(merged.validation.summary.uniqueSampleCount, 6)
  assert.equal(merged.validation.eventSampling[0].sampleRateHz, 50)
  assert.equal(merged.manifest.privacy.anonymousSession, true)
  assert.equal(JSON.stringify(merged).includes('person@example.com'), false)
})

test('checksum corruption is rejected', () => {
  const manifest = readJson(manifestFile)
  const chunk = readJson(chunkFile)
  chunk.payload.events[0].samples[2].x = 99
  const merged = mergeAndValidate(manifest, [chunk])
  assert.equal(merged.validation.ok, false)
  assert(merged.validation.issues.some((issue) => issue.code === 'chunk_checksum'))
})

test('missing manifest chunk is rejected', () => {
  const manifest = readJson(manifestFile)
  const merged = mergeAndValidate(manifest, [])
  assert.equal(merged.validation.ok, false)
  assert(merged.validation.issues.some((issue) => issue.code === 'missing_chunk'))
})

test('sensor gaps are reported without confusing event-to-event idle time', () => {
  const manifest = readJson(manifestFile)
  const chunk = readJson(chunkFile)
  chunk.payload.events[0].samples[3].t = 1001220
  chunk.payload.events[0].samples[4].t = 1001240
  chunk.payload.events[0].samples[5].t = 1001260
  chunk.checksum = checksum(chunk.payload)
  manifest.chunks[0].checksum = chunk.checksum
  manifest.chunks[0].serializedLength = JSON.stringify(chunk).length
  const merged = mergeAndValidate(manifest, [chunk])
  assert.equal(merged.validation.ok, true)
  assert.equal(merged.validation.eventSampling[0].sampleRateHz, 50)
  assert.equal(merged.validation.eventSampling[0].gapCount, 1)
  assert(merged.validation.issues.some((issue) => issue.code === 'sample_gap'))
})

test('non-monotonic time and duplicate samples are reported', () => {
  const manifest = readJson(manifestFile)
  const chunk = readJson(chunkFile)
  const duplicateEvent = structuredClone(chunk.payload.events[0])
  duplicateEvent.id = 'cap-fixture-anonymous-e1'
  duplicateEvent.samples[1].t = duplicateEvent.samples[0].t
  chunk.payload.events.push(duplicateEvent)
  chunk.checksum = checksum(chunk.payload)
  manifest.chunks[0].checksum = chunk.checksum
  manifest.chunks[0].eventCount = 2
  manifest.chunks[0].serializedLength = JSON.stringify(chunk).length
  const merged = mergeAndValidate(manifest, [chunk])
  assert.equal(merged.validation.ok, false)
  assert(merged.validation.summary.duplicateSampleCount > 0)
  assert(merged.validation.issues.some(
    (issue) => issue.code === 'sample_time_non_monotonic'
  ))
  assert(merged.validation.issues.some((issue) => issue.code === 'overlapping_samples'))
})

test('CSV contains event decisions and raw axes', () => {
  const chunk = readJson(chunkFile)
  const csv = eventsToCsv(chunk.payload.events)
  assert(csv.startsWith('session_id,event_id,stage_index'))
  assert(csv.includes(',true,accepted,'))
  assert(csv.includes(',0.1,0.2,9.8'))
})

test('CLI writes merged JSON and CSV', () => {
  const outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bmt-capture-test-'))
  const jsonFile = path.join(outputRoot, 'merged.json')
  const csvFile = path.join(outputRoot, 'samples.csv')
  const result = childProcess.spawnSync(process.execPath, [
    path.join(root, 'tools/merge-capture.mjs'),
    '--manifest', manifestFile,
    '--chunks-dir', path.join(fixtureRoot, 'chunks'),
    '--out-json', jsonFile,
    '--out-csv', csvFile
  ], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.equal(JSON.parse(fs.readFileSync(jsonFile, 'utf8')).validation.ok, true)
  assert(fs.readFileSync(csvFile, 'utf8').includes('cap-fixture-anonymous-e0'))
})
