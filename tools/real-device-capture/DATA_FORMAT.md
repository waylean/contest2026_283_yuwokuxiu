# BMT real-device capture format

The format identifier is `bmt-capture-v1`. Export consists of one manifest JSON
value and the chunk JSON values named by `manifest.chunks[].key`.

## Manifest

- `captureApp`: capture package, version, sensor API, requested interval and
  event-window sizes.
- `privacy`: explicit collected and excluded categories.
- `session`: anonymous random ID and start, end, active and export timestamps.
- `stages[]`: stage index, label, expected count, actual candidate count, start
  and end timestamps.
- `chunks[]`: ordered storage key, event count, serialized length and FNV-1a
  checksum.
- `nextSampleSeq`: next session-local sequence number, used for recovery and
  duplicate detection.

`system.storage` keys are:

- `bmt_capture_active_manifest_v1`: latest recovery checkpoint.
- `bmt_capture_export_manifest_v1`: frozen export index.
- `bmt_capture_chunk_<session-id>_<index>`: completed event chunks.

## Diagnostic export transport

The diagnostic package can transmit the frozen manifest and chunk records over
`system.interconnect` to the repository's minimal AstroBox collector. This
transport is not used by the production contest package.

Each record is split into `bmt_capture_fragment_v1` frames of at most 700
characters. Frames include the anonymous session ID, record category, chunk
index, part number, total parts, payload length and FNV-1a checksum. A
`bmt_capture_complete_v1` marker declares the expected chunk count.

The computer-side recovery tool accepts identical retries and out-of-order
frames, but rejects conflicting duplicates, missing parts, invalid checksums,
missing completion markers and incorrect chunk counts. The original
`system.storage` values remain authoritative. A connection or read failure does
not delete them and the user may retry export.

The checksum is lowercase, eight-digit FNV-1a over `JSON.stringify(payload)`.
It detects accidental truncation or modification; it is not a signature.

## Chunk and event

Each chunk is `{ "payload": ..., "checksum": "..." }`. Its payload contains the
format, session ID, zero-based index, creation time and one completed event.

Each event contains:

- stage identity and whether the stage label was active;
- candidate start/end time and algorithm revision;
- `accepted`, `reason`, and `qualityScore`;
- the production algorithm estimate when quality scoring reaches that step;
- algorithm features including acceleration/jerk peaks, energy, burst and
  direction ratios, impulse, duration, peak latency, width, interval, sample
  count and running-like classification;
- `samples[]` with session-local `seq`, Unix epoch milliseconds `t`, measured
  interval `dt`, and accelerometer `x`, `y`, `z`.

Event windows may overlap. The validator reports repeated sequence numbers as
overlap and emits a deduplicated `uniqueSamples` array in merged JSON. CSV keeps
the event-to-sample relationship and can therefore contain the same sequence in
two event rows.

## Bounds and privacy

The watch retains about 50 pre-trigger samples and one second after a candidate.
Only completed candidate windows are persisted. Each event is committed as a
chunk and a session is capped at 120 chunks. No continuous multi-hour raw stream
is stored.

The schema has no fields for name, location, device key, video, account or
network identity. Fixture timestamps and values are synthetic.
