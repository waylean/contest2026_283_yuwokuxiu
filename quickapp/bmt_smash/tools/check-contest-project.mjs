import fs from 'node:fs'
import path from 'node:path'
import childProcess from 'node:child_process'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8'))
const page = fs.readFileSync(path.join(root, 'src/index/index.ux'), 'utf8')
const features = (manifest.features || []).map((item) => item.name)
const errors = []

function requireValue (condition, message) {
  if (!condition) errors.push(message)
}

requireValue(manifest.package === 'com.waylean.bmtsmash.contest', 'competition package identity')
requireValue(manifest.versionName === '0.1.0' && manifest.versionCode === 100, 'competition version')
requireValue(manifest.config?.buildMode === 'standalone', 'standalone build mode')
requireValue(manifest.config?.deviceProfile === 'xiaomi-band-10-pro', '10 Pro device profile')
requireValue(manifest.config?.deviceScreen === '336x480', '10 Pro screen')
requireValue(features.includes('system.sensor'), 'system.sensor declaration')
requireValue(features.includes('system.storage'), 'system.storage declaration')
requireValue(features.includes('system.brightness'), 'system.brightness declaration')
requireValue(features.includes('system.router'), 'system.router declaration')
requireValue(!features.includes('system.interconnect'), 'no system.interconnect declaration')
requireValue(!page.includes("@system.interconnect"), 'no interconnect runtime import')
requireValue(!page.includes('controlLinkStatus'), 'no phone link UI')
requireValue(!page.includes('bmts_bridge'), 'no legacy bridge protocol')
requireValue(!page.includes('sendSyntheticRawChunk'), 'no synthetic linked-session code')
requireValue(page.includes("const DEVICE_MODEL = 'Xiaomi Smart Band 10 Pro'"), '10 Pro runtime identity')
requireValue(page.includes("const HEART_RATE_MODE = 'poll'"), 'safe heart-rate polling')
requireValue(page.includes("appVersion: '0.1.0-contest'"), 'contest session version')
requireValue(page.includes('waveformText'), 'real-time acceleration waveform')
requireValue(page.includes('evaluateSwingQuality'), 'production swing algorithm runtime')
requireValue(page.includes('onBackPress'), 'active-session back guard')
requireValue(page.includes('exitApp'), 'explicit exit')
requireValue(page.includes('unsubscribeAccelerometer'), 'sensor cleanup')
requireValue(page.includes('saveSessionHistory'), 'local history')

try {
  childProcess.execFileSync('node', ['tools/sync-algorithm-runtime.mjs', '--check'], {
    cwd: root,
    stdio: 'inherit'
  })
} catch (err) {
  errors.push('generated competition algorithm runtime')
}

if (errors.length) {
  errors.forEach((error) => console.error(`FAIL ${error}`))
  process.exitCode = 1
} else {
  console.log('OK contest wearable structure and standalone boundary')
}
