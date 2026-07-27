# BMT Smash

BMT Smash 是面向羽毛球爱好者的 openvela 独立手环训练应用。应用在小米手环
10 Pro 上使用三轴加速度计识别候选挥拍，过滤普通摆臂、跑动、撞击和击球后
回位动作，并在手环本地显示挥拍强度、有效挥拍、预测球速、心率、历史记录和
比分。

本作品属于 **手表应用创新** 方向，核心训练流程不依赖手机、网络或云服务。

## 用户问题

普通羽毛球爱好者很难在日常球场获得挥拍反馈。专业雷达和高速摄影成本高、
准备复杂，而手环始终位于持拍手腕，适合提供低成本、可持续的训练参考。

BMT Smash 不将结果描述为雷达实测。挥拍强度和预测球速是基于腕部加速度、
人体尺寸和球拍物理关系得到的训练估计值。

## 产品流程

1. 用户设置持拍手、身高和表带松紧。
2. 在控制页开始训练。
3. 应用以前台高频加速度采样识别有效挥拍。
4. 指标页显示实时加速度波形、挥拍强度、有效次数、最大强度和预测球速。
5. 心率服务可用时显示当前、平均和最高心率；不可用不会阻塞挥拍检测。
6. 结束后将摘要写入本地历史，支持冷启动恢复。
7. 应用包含独立计分和明确退出路径。

## openvela 能力

| 能力 | 用途 |
| --- | --- |
| Quick App 图形与交互 | 七个可滑动页面、实时波形、历史和计分 |
| `system.sensor` | 前台三轴加速度采样 |
| `service.health` | 可选心率读取和故障隔离 |
| `system.storage` | 设置、训练恢复和本地历史 |
| `system.brightness` | 训练期间保持屏幕可见 |
| `system.router` | 可恢复的明确退出 |

## 目录

- `quickapp/bmt_smash/`：小米手环 10 Pro 独立版 Quick App。
- `test-data/`：匿名合成传感器回放数据。
- `preview/exports/contest-emulator/`：336×480 模拟器验收截图。
- `skills/openvela-wearable-swing/`：可复用 AI Coding Skill。
- `docs/`：架构、算法边界、赛事要求、验收和后续计划。
- `logs/`：官方采集器导出的 AI Coding 日志。

## 构建与验证

```bash
npm run install:quickapp
npm run check
npm run replay
npm run build
```

构建使用 Xiaomi Vela/openvela Quick App 工具链，启用 JSC，禁用
protobuf。生成的 RPK、签名材料和本地设备凭据不进入仓库。

模拟器证据：

```bash
npm run emulator:capture
```

该命令安装应用并验证控制页、指标页、心率页、开始与结束生命周期，以及退出
后冷启动恢复历史。

## 算法边界

算法采用可解释的物理特征和质量门控，包括峰值动态加速度、jerk、冲量、
持续时间、方向一致性、峰值位置和回位关系。当前合成回放用于回归测试，不代表
真实准确率。真实球场准确率与60分钟稳定性报告是下一阶段验收门槛。

## AI Coding

AI 协作覆盖需求整理、代码重构、算法测试、模拟器调试、双智能体盲审和赛事
材料整理。可复用流程沉淀在 `skills/openvela-wearable-swing/`，结构化摘要在
`docs/ai-native-development-log.md`。官方格式对话由赛事采集器写入 `logs/`。

## 当前证据

- 独立应用边界和敏感信息扫描通过。
- 生产算法与运行时代码一致性检查通过。
- 误判、回位、强度单调性和物理上限测试通过。
- JSC-only 构建通过。
- 模拟器启动、训练、停止、退出、冷启动历史恢复通过。

完整结果见 `docs/phase-2-acceptance.md`。

## 开源与合规

本仓遵循 Apache License 2.0。作品不属于医疗设备或专业测速仪器，不上传用户
身份、健康记录、AuthKey、签名密钥、APK 或 RPK。
