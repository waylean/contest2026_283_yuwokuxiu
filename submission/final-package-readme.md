# BMT Smash 参赛作品包

## 基本信息

- 大赛：2026 首届 openvela AI 硬件开发者大赛
- 队伍：羽我苦修
- 作品：BMT Smash
- 方向：手表应用创新
- 目标设备：小米手环 10 Pro

## 目录说明

1. `01-作品介绍文档`：正式 PDF、可编辑 DOCX 和 Markdown 源稿。
2. `02-项目代码`：净化后的参赛源码，不包含依赖缓存、构建产物和设备凭据。
3. `03-Demo演示视频`：2 分钟、1920×1080、H.264 演示视频。
4. `04-补充证据`：模拟器截图、算法说明、验收结果和提交状态。

## 构建

```bash
npm run install:quickapp
npm run check
npm run replay
npm run build
```

构建使用 JSC，禁用 protobuf。生成的 RPK、签名材料和本地设备凭据不进入提交包。

## 官方仓库

- 仓库：https://github.com/open-vela/contest2026_283_yuwokuxiu
- 目标分支：`dev-ai-contest-2026`
- PR：https://github.com/open-vela/contest2026_283_yuwokuxiu/pull/1

状态更新（2026-09-08）：PR #1 已合并至官方赛事分支。本文为旧压缩包目录说明，不代表其中 PDF、DOCX 和 MP4 附件已经上传仓库；附件状态见本目录 README。
