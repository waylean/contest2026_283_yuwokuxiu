# Third-Party Notices

The BMT Smash source is licensed under Apache-2.0. The following direct
development and build dependencies retain their own licenses:

| Package | Version | License | Use |
| --- | ---: | --- | --- |
| `aiot-toolkit` | 2.0.5 | ISC | Quick App build and packaging |
| `@aiot-toolkit/emulator` | 2.0.5 | ISC | openvela wearable emulator automation |
| `@aiot-toolkit/jsc` | 1.0.8 | ISC | JSC bytecode generation |
| `pngjs` | 5.0.0 | MIT | Screenshot pixel validation |

Dependency versions are locked by `quickapp/bmt_smash/package-lock.json`.
Transitive dependencies and their metadata can be inspected after a clean
install with:

```bash
npm --prefix quickapp/bmt_smash ci
npm --prefix quickapp/bmt_smash ls --all
```

No third-party application source, proprietary device key or commercial RPK is
committed to this repository.
