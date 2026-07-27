#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { eventsToCsv, mergeAndValidate } from './capture-format.mjs'
import { parseFrames, reassembleFrames } from './export-stream.mjs'

const args = process.argv.slice(2)
const inputIndex = args.indexOf('--input')
const outputIndex = args.indexOf('--out')
if (inputIndex < 0 || !args[inputIndex + 1] ||
    outputIndex < 0 || !args[outputIndex + 1]) {
  console.error('Usage: recover-export.mjs --input astrobox.log --out output-dir')
  process.exit(2)
}

const input = path.resolve(args[inputIndex + 1])
const outputRoot = path.resolve(args[outputIndex + 1])
const sessions = reassembleFrames(parseFrames(fs.readFileSync(input, 'utf8')))
if (!sessions.length) {
  console.error('No BMT capture frames found.')
  process.exit(1)
}

for (const session of sessions) {
  const directory = path.join(outputRoot, session.sessionId)
  const chunksDirectory = path.join(directory, 'chunks')
  fs.mkdirSync(chunksDirectory, { recursive: true })
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    `${JSON.stringify(session.manifest, null, 2)}\n`
  )
  session.chunks.forEach((chunk, index) => {
    fs.writeFileSync(
      path.join(chunksDirectory, `chunk-${String(index).padStart(3, '0')}.json`),
      `${JSON.stringify(chunk, null, 2)}\n`
    )
  })
  const merged = mergeAndValidate(session.manifest, session.chunks)
  fs.writeFileSync(
    path.join(directory, 'capture.json'),
    `${JSON.stringify(merged, null, 2)}\n`
  )
  fs.writeFileSync(
    path.join(directory, 'samples.csv'),
    eventsToCsv(merged.events)
  )
  console.log(
    `${merged.validation.ok ? 'OK' : 'FAIL'} ${session.sessionId}: ` +
    `${merged.events.length} events, ${merged.uniqueSamples.length} unique samples`
  )
  if (!merged.validation.ok) process.exitCode = 1
}
