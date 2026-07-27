import childProcess from 'node:child_process'
import path from 'node:path'

const wearableRoot = path.resolve(new URL('..', import.meta.url).pathname)
const aiot = path.join(wearableRoot, 'node_modules', '.bin', 'aiot')
const result = childProcess.spawnSync(aiot, ['build', '--enable-jsc'], {
  cwd: wearableRoot,
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024
})
const output = `${result.stdout || ''}${result.stderr || ''}`
process.stdout.write(output)

if (
  result.status !== 0 ||
  !output.includes('build success') ||
  output.includes('build error') ||
  output.includes('Parsing error')
) {
  console.error('FAIL aiot build did not produce a verified successful result')
  process.exitCode = 1
}
