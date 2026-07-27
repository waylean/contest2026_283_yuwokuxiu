#!/usr/bin/env python3
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "target/wasm32-wasip2/release/bmt_capture_collector.wasm"
DIST = ROOT / "dist"

if not TARGET.is_file():
    raise SystemExit(f"missing wasm: {TARGET}")

DIST.mkdir(parents=True, exist_ok=True)
for name in ("manifest.json", "icon.png"):
    shutil.copy2(ROOT / name, DIST / name)
shutil.copy2(TARGET, DIST / TARGET.name)

manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
output = DIST / "BMT Capture Collector.abp"
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    archive.write(DIST / "manifest.json", "manifest.json")
    archive.write(DIST / "icon.png", "icon.png")
    archive.write(DIST / TARGET.name, manifest["entry"])
print(output)
