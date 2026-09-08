# BMT Smash

## 一、作品简介

**队伍：羽我苦修（283）｜目标设备：小米手环 10 Pro 独立版。**

BMT Smash 是面向羽毛球爱好者的手环训练应用，利用持拍手腕三轴加速度识别具有挥拍形态的动作，在手环本地提供挥拍强度、有效次数、预测球速、实时波形、可选心率、历史回放和计分。核心训练流程不依赖手机、网络或云服务。

日常球场缺少低成本、低干扰的反馈工具。本作品通过多特征质量门控过滤普通摆臂、跑动、窄脉冲碰撞和击球后回位，而不是仅凭一次加速度峰值判定挥拍。用户设置持拍手、身高和表带松紧后开始训练，结束后查看本地历史。

挥拍强度和预测球速是**训练估计值，不是雷达实测**。合成测试验证算法性质，不代表真实球场准确率；三轴加速度不能完整恢复球拍姿态。心率只作运动参考，不用于医疗诊断。

评审材料：[作品介绍 PDF](materials/BMT-Smash.pdf)、[可编辑 DOCX](materials/BMT-Smash.docx)、[两分钟演示视频](materials/BMT-Smash-demo.mp4)、[材料目录](README.md)。

## 二、选题方向

**快应用 / 手表应用创新。** 选择已有手环作为载体，通过 openvela Quick App 图形、传感器和本地存储能力提供羽毛球专项训练体验，不涉及新开发板、BSP、驱动或固件移植。Android 联动版不属于本次参赛范围。

| 能力 | 使用方式 |
| --- | --- |
| Quick App 图形与交互 | 横向页面导航、实时波形、历史列表和计分 |
| `system.sensor` | 前台三轴加速度采样，申请 game 档，实际间隔以回调为准 |
| `service.health` | 可选心率读取，失败时独立降级 |
| `system.storage` | 设置、训练快照与有界历史摘要 |
| `system.brightness` | 训练亮屏管理，能力缺失不阻塞主流程 |
| `system.router` | 明确退出与重新进入 |

图形与采样分离，UI 按 80 ms 节流；候选窗口结合峰值、jerk、冲量、持续时间和方向一致性判断。停止后的延迟回调被隔离，避免继续修改训练状态。详见[架构说明](../docs/architecture.md)。

对 openvela 的改进建议：统一不同设备的传感器能力矩阵和健康服务错误码；提供连续传感器 Mock 示例、生命周期测试模板和可穿戴安全区预览，降低高频传感器应用的适配成本。

## 三、目录结构

| 路径 | 用途 |
| --- | --- |
| `quickapp/bmt_smash/src/` | 独立快应用界面、生命周期与设备能力调用 |
| `quickapp/bmt_smash/src/common/scripts/competitionSwingAlgorithm.js` | 规范算法源，构建时确定性同步到运行时 |
| `quickapp/bmt_smash/tools/` | 构建、一致性检查、回放、性质测试与自动截图 |
| `test-data/` | 合成传感器夹具，不含真实用户数据 |
| `preview/exports/contest-emulator/` | 336×480 模拟器截图 |
| `docs/` | 算法、架构、验收、AI 工作流与隐私说明 |
| `logs/` | 官方采集器 AI Coding 日志及索引 |
| `skills/openvela-wearable-swing/` | 可复用 Skill 和项目审计脚本 |
| `submission/` | 作品介绍、材料索引与提交状态 |
| `contest2026_283_yuwokuxiu.xml` | 队伍 manifest 与应用目录映射 |
| `LICENSE`、`NOTICE`、`THIRD_PARTY_NOTICES.md` | Apache-2.0 与第三方依赖说明 |

## 四、运行方式

### 4.1 环境准备

已有验收来自 **macOS、AIoT 工具链 2.0.5、336×480 模拟器**。需要 Git、Node.js/npm 和 AIoT-IDE；依赖版本以 `quickapp/bmt_smash/package-lock.json` 为准。Node.js 最低版本尚未单独验证，应按工具链官方要求安装。

构建和截图脚本基于 POSIX 路径，建议在已验证的 macOS 环境复现；Windows 原生脚本兼容性未验证。

官方入口：[AIoT-IDE 使用文档](https://iot.mi.com/vela/quickapp/zh/guide/start/use-ide.html)、[大赛快应用教程](https://github.com/open-vela/docs/blob/dev-ai-contest-2026/zh-cn/contest_2026/quickapp/quickapp_guide_index.md)。

### 4.2 获取、检查与构建

仅构建快应用无需编译整套固件：

```bash
git clone --branch dev-ai-contest-2026 https://github.com/open-vela/contest2026_283_yuwokuxiu.git
cd contest2026_283_yuwokuxiu
npm run install:quickapp
npm run check
npm run replay
npm run build
```

预期输出包含算法源码/运行时一致性通过、误判/回位/单调性/上限性质测试通过，以及 `build success`。合成回放结果不是实战检出率。

当前版本产物：

```text
quickapp/bmt_smash/dist/com.waylean.bmtsmash.contest.debug.0.1.0.rpk
```

构建启用 JSC，不启用 protobuf。RPK 为本地调试产物，私人签名材料不随源码提交。

如需通过赛事 manifest 拉取完整工作区，先安装官方要求的 `repo` 工具，再执行：

```bash
repo init -u https://github.com/open-vela/contest2026_283_yuwokuxiu -b dev-ai-contest-2026 -m contest2026_283_yuwokuxiu.xml
repo sync -c -j8
```

应用映射至 `packages/apps/contest2026_283_bmt_smash`，不要求烧写自定义固件。

### 4.3 模拟器部署与操作

1. 用 AIoT-IDE 打开 `quickapp/bmt_smash`，按官方教程安装模拟器 SDK/镜像并创建 336×480 虚拟设备。
2. 自动截图脚本要求设备名为 `Vela_WForge_review_band10pro`。脚本不会自动下载镜像或创建设备。
3. 完成构建后，在仓库根目录执行：

```bash
npm run emulator:capture
```

脚本启动指定设备，推送并安装 RPK，启动 `com.waylean.bmtsmash.contest`，检查页面、结束后的存活状态、退出和冷启动历史恢复，输出五张截图至 `preview/exports/contest-emulator/`，最后停止模拟器。

手动体验可通过 IDE 部署构建产物，打开 BMT Smash，设置持拍信息并开始训练；左右滑动查看各页，结束后查看历史，使用控制页退出按钮退出。模拟器没有真实挥拍信号时，次数保持零不代表异常，信号链路可通过 `npm run replay` 验证。

### 4.4 已知限制与排错

- `Missing emulator`：先创建脚本指定名称的设备并完成 SDK/镜像配置。
- `Missing RPK`：先构建，检查产物路径是否一致。
- 通用镜像可能缺少健康和亮屏服务，心率显示缺省值；主训练流程应继续。模拟器不能证明真机心率可用性。
- 已归档验收覆盖启动、导航、短训练、停止、退出及冷启动历史；长时间球场稳定性与真实准确率仍需独立验证。
- 基线是前台训练，不承诺任意机型息屏后台采样或与系统运动并行运行。

## 五、AI Coding 使用说明

AI 协作覆盖需求拆解、方案设计、代码实现、调试、测试与文档整理；人工确定目标用户、独立版范围、产品取舍和证据边界。Codex 参与实现与验收，独立 AI 审查用于查找算法和生命周期问题，K3 设计委派与 HyperFrames 用于演示材料。

实际帮助包括：将商业/联动版本隔离为独立参赛版；建立唯一算法源及一致性检查；构造坐标、幅值、回调间隔和窄脉冲性质测试；通过模拟器定位模块兼容与退出清理问题。AI 输出必须经过检查，不能以生成成功代替验收。

- [结构化开发日志](../docs/ai-native-development-log.md)：阶段目标、修改、审查和验证。
- [官方日志](../logs/waylean/)：采集器会话与 manifest。
- [隐私审计](../docs/ai-log-privacy-audit.md)：混合商业项目会话排除与脱敏策略。
- [可复用 Skill](../skills/openvela-wearable-swing/SKILL.md)：独立运行边界、结构审计和验证流程。
- 工具链：本地 CLI 用于构建和回放；浏览器与 GitHub 工具用于文档核验和提交；多智能体工具用于独立审查。MCP 的具体调用以官方会话记录为准。

**AI 使用统计：** AI 参与代码实现、测试和文档编写；逐行代码占比未单独统计。官方日志保留原始 Token 字段，但尚无经去重核验的总消耗，本作品不提供估算数值。

本仓使用 Apache-2.0，不包含设备 AuthKey、私人签名密钥或真实用户健康数据。
