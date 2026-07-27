import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  VvdManager,
  defaultSDKHome,
  defaultVvdHome
} from '@aiot-toolkit/emulator'
import { PNG } from 'pngjs'

const wearableRoot = path.resolve(new URL('..', import.meta.url).pathname)
const repositoryRoot = path.resolve(wearableRoot, '../..')
const outputRoot = path.join(repositoryRoot, 'preview', 'exports', 'contest-emulator')
const packageName = 'com.waylean.bmtsmash.contest'
const vvdName = 'Vela_WForge_review_band10pro'
const rpkPath = path.join(
  wearableRoot,
  'dist',
  'com.waylean.bmtsmash.contest.debug.0.1.0.rpk'
)
const sdkHome = defaultSDKHome || path.join(os.homedir(), '.vela/sdk')
const vvdHome = defaultVvdHome || path.join(os.homedir(), '.vela/vvd')
const manager = new VvdManager({ sdkHome, vvdHome })

if (!fs.existsSync(rpkPath)) {
  throw new Error(`Missing RPK: ${rpkPath}. Run npm run build first.`)
}
if (!manager.getVvdList().some((item) => item.name === vvdName)) {
  throw new Error(`Missing emulator ${vvdName}`)
}

fs.mkdirSync(outputRoot, { recursive: true })
console.log(`Starting ${vvdName}`)
const started = await manager.startVvd({ vvdName })

try {
  const instance = started.emulatorInstance
  if (!instance) throw new Error('Emulator instance unavailable')
  const targetPath = await instance.pushRpk(rpkPath, packageName)
  await withTimeout(instance.install(targetPath, { packageName }), 15000, 'install')
  try {
    await withTimeout(instance.startApp(packageName), 10000, 'startApp')
  } catch (err) {
    console.log(`startApp returned ${err && err.message ? err.message : err}`)
  }

  const agent = await started.getAgent()
  await agent.waitForReady()
  await sleep(7000)
  await capture(agent, '01-control.png')
  await swipeLeft(agent)
  await sleep(1400)
  await capture(agent, '02-metrics-waveform.png')
  await swipeLeft(agent)
  await sleep(1400)
  await capture(agent, '03-heart-rate.png')
  await swipeRight(agent)
  await sleep(500)
  await swipeRight(agent)
  await sleep(800)
  await tap(agent, 92, 322)
  await sleep(3000)
  await swipeRight(agent)
  await sleep(800)
  await tap(agent, 92, 413)
  await sleep(7000)
  await capture(agent, '04-post-stop-lifecycle.png')
  await tap(agent, 245, 413)
  // The Vela emulator tears down Quick App feature instances asynchronously.
  // Restarting during that window can trigger a native data abort in the
  // emulator even though the application has already exited correctly.
  await sleep(5000)
  try {
    await withTimeout(instance.startApp(packageName), 10000, 'restartApp')
  } catch (err) {
    console.log(`restartApp returned ${err && err.message ? err.message : err}`)
  }
  await sleep(10000)
  for (let index = 0; index < 4; index += 1) {
    await swipeLeft(agent)
    await sleep(650)
  }
  await capture(agent, '05-history-after-relaunch.png')
  agent.close()
} finally {
  await manager.stopVvd(vvdName).catch(() => {})
}

console.log(`Captured emulator evidence in ${outputRoot}`)

async function capture(agent, name) {
  const image = await agent.getScreenshot()
  const file = path.join(outputRoot, name)
  fs.writeFileSync(file, image)
  assertVisibleScreenshot(image, name)
  console.log(`Captured ${path.relative(repositoryRoot, file)}`)
}

function assertVisibleScreenshot(buffer, name) {
  const png = PNG.sync.read(buffer)
  if (png.width !== 336 || png.height !== 480) {
    throw new Error(`${name} has unexpected size ${png.width}x${png.height}`)
  }
  let darkPixels = 0
  let lightPixels = 0
  for (let offset = 0; offset < png.data.length; offset += 4) {
    const luminance =
      png.data[offset] * 0.299 +
      png.data[offset + 1] * 0.587 +
      png.data[offset + 2] * 0.114
    if (luminance < 48) darkPixels += 1
    if (luminance > 220) lightPixels += 1
  }
  if (darkPixels < 500 || lightPixels < 10000) {
    throw new Error(
      `${name} does not contain the expected rendered black-and-white UI`
    )
  }
}

async function swipeLeft(agent) {
  const y = 250
  const points = [285, 250, 215, 180, 145, 110, 75, 45]
  for (const x of points) {
    agent.sendMouse({ x, y, buttons: 1 })
    await sleep(35)
  }
  agent.sendMouse({ x: 45, y, buttons: 0 })
}

async function swipeRight(agent) {
  const y = 250
  const points = [45, 75, 110, 145, 180, 215, 250, 285]
  for (const x of points) {
    agent.sendMouse({ x, y, buttons: 1 })
    await sleep(35)
  }
  agent.sendMouse({ x: 285, y, buttons: 0 })
}

async function tap(agent, x, y) {
  agent.sendMouse({ x, y, buttons: 1 })
  await sleep(90)
  agent.sendMouse({ x, y, buttons: 0 })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((resolve, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    )
  ])
}
