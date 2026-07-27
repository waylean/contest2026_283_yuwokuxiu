import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const repositoryRoot = path.resolve(root, '../..')
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'src/manifest.json'), 'utf8')
)
const page = fs.readFileSync(path.join(root, 'src/index/index.ux'), 'utf8')
const productionManifest = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, 'quickapp/bmt_smash/src/manifest.json'), 'utf8')
)
const productionAlgorithm = fs.readFileSync(path.join(
  repositoryRoot,
  'quickapp/bmt_smash/src/common/scripts/competitionSwingAlgorithm.js'
), 'utf8')
const captureAlgorithm = fs.readFileSync(path.join(
  root,
  'src/common/scripts/captureSwingAlgorithm.js'
), 'utf8')
const features = (manifest.features || []).map((feature) => feature.name)
const failures = []

function check (condition, message) {
  if (condition) console.log(`OK ${message}`)
  else failures.push(message)
}

check(manifest.package === 'com.waylean.bmtsmash.capture', 'isolated capture package')
check(productionManifest.package === 'com.waylean.bmtsmash.contest',
  'production package remains unchanged')
check(features.includes('system.sensor'), 'sensor feature declared')
check(features.includes('system.storage'), 'storage feature declared')
check(features.includes('system.router'), 'router feature declared')
check(features.includes('system.interconnect'), 'interconnect declared for export')
check(page.includes("interval: 'game'"), 'game accelerometer interval')
check(page.includes('RING_SAMPLES = 50'), 'approximately one-second ring buffer')
check(page.includes('POST_WINDOW_MS = 1000'), 'post-event window')
check(page.includes('MAX_CHUNKS = 120'), 'finite storage bound')
check(page.includes('unsubscribeAccelerometer'), 'sensor cleanup')
check(page.includes('stopCapture'), 'explicit stop control')
check(page.includes('exitApp'), 'explicit exit control')
check(page.includes('ACTIVE_MANIFEST_KEY'), 'recoverable active manifest')
check(page.includes('accepted: accepted'), 'event decision persisted')
check(page.includes('stageName: this.stageName'), 'event stage label persisted')
check(captureAlgorithm === productionAlgorithm, 'capture algorithm matches production source')
check(page.includes("'静止', '步行', '普通摆臂', '持拍回位', '过顶空挥', '实际击球'"),
  'all required stages')
check(page.includes('initInterconnect'), 'interconnect import is wrapped in adapter')
check(page.includes('interconnectSender.available'), 'interconnect availability checked before use')
check(fs.existsSync(path.join(root, 'src/common/scripts/interconnectExport.js')),
  'interconnect chunked export module')
check(fs.existsSync(path.join(root, 'astrobox-collector/src/lib.rs')),
  'AstroBox collector source')
check(fs.existsSync(path.join(root, 'tools/recover-export.mjs')),
  'computer export recovery tool')
check(fs.existsSync(path.join(root, 'DATA_FORMAT.md')), 'data format documentation')
check(fs.existsSync(path.join(root, 'test/fixtures/manifest.json')), 'anonymous fixture')

for (const failure of failures) console.error(`FAIL ${failure}`)
if (failures.length) process.exitCode = 1
else console.log('OK isolated real-device capture structure')
