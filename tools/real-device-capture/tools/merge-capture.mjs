#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {
  eventsToCsv,
  listChunkFiles,
  loadCapture
} from './capture-format.mjs'

function usage () {
  console.log(
    'Usage: node tools/merge-capture.mjs --manifest manifest.json ' +
    '--chunks-dir exported-chunks --out-json capture.json --out-csv capture.csv'
  )
}

function readArgs (argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || value === undefined) return null
    args[key.slice(2)] = value
  }
  return args
}

const args = readArgs(process.argv.slice(2))
if (!args?.manifest || !args['chunks-dir'] || !args['out-json'] || !args['out-csv']) {
  usage()
  process.exitCode = 2
} else {
  const chunkFiles = listChunkFiles(args['chunks-dir'], args.manifest)
  const merged = loadCapture(args.manifest, chunkFiles)
  fs.mkdirSync(path.dirname(path.resolve(args['out-json'])), { recursive: true })
  fs.mkdirSync(path.dirname(path.resolve(args['out-csv'])), { recursive: true })
  fs.writeFileSync(args['out-json'], `${JSON.stringify(merged, null, 2)}\n`)
  fs.writeFileSync(args['out-csv'], eventsToCsv(merged.events))

  const summary = merged.validation.summary
  console.log(
    `${merged.validation.ok ? 'OK' : 'FAIL'} ${summary.eventCount} events, ` +
    `${summary.uniqueSampleCount} unique samples, ` +
    `${summary.duplicateSampleCount} overlapping samples`
  )
  for (const issue of merged.validation.issues) {
    console.log(`${issue.severity.toUpperCase()} ${issue.code}: ${issue.message}`)
  }
  if (!merged.validation.ok) process.exitCode = 1
}
