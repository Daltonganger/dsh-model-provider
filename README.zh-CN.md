# dsh-model-provider

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

> **License:** MIT · **Platform:** DSH Web（客户端插件）

**[English](README.md) · [简体中文](README.zh-CN.md)**

Provider-first Model Selector —— DeepSeek Harness 模型选择器插件。
> 先选择模型供应商，再选择该供应商下的模型；当前模型始终显示 `Model · Provider`，
> 但不改变 DeepSeek Harness 原有模型调用和会话状态逻辑。

在 DeepSeek Harness 的 Web 界面中，把编译器（composer）里的模型座位（model seat）从
「Provider 分组 + 全模型展开」升级为 **三级选择器**（v0.3.0）：

    启用前                    启用后（本插件 v0.3.0）
    DeepSeek V4 Flash          DeepSeek V4 Flash · OpenCode Go

试试打开下拉（模型很多也不乱）：

    第一层（主菜单）            第二层（Provider）            第三层（Model）
    ├─ 模型   DeepSeek V4 Flash >   ├─ opencode-go  8 个模型 · 当前 >   opencode-go
    └─ 推理等级 High            >   ├─ luckikey     2 个模型       >   ├─ MiniMax-M3
    🔍 搜索供应商                   ├─ OpenRouter  20 个模型      >   ├─ Qwen3.7 Max
        （过滤 Provider 行）            ├─ DeepSeek     4 个模型       >   ├─ DeepSeek V4 Flash ✓
                                      └─ OpenRouterX  加载失败 ⚠ 重试    ├─ DeepSeek V4 Pro
                                   🔍 搜索 opencode-go 模型            └─ GLM-5.1
                                      （只搜当前供应商）

<img width="1920" height="945" alt="image" src="https://github.com/user-attachments/assets/6fb97a93-43f7-4d05-b9bb-dc77273759f9" />
<img width="1920" height="945" alt="image" src="https://github.com/user-attachments/assets/e011060a-56d9-4744-ab76-359aab52f75e" />

- **Provider 单独成为一级**：Provider 列表把**当前供应商置顶**并标出「· 当前」；其余
  供应商保持目录顺序。Model 页只渲染选中供应商的模型，不再平铺 Provider × Model。
- **失败 Provider 也是一行**：加载失败的供应商不会只出现在警告横幅里，而是作为普通
  Provider 行展示（「加载失败 ⚠ 重试」），点击即重载。
- **搜索（v0.3）**：Provider 页和 Model 页都有行内搜索框 —— Provider 页按名称/ID 过滤
  供应商，Model 页只过滤**当前供应商**的模型（不跨 Provider 搜索）。
- **Model 页头部**：进入某供应商后，顶部为「‹ {供应商名}」+「{N} 个模型」副标题，
  更像一个独立页面。
- **触发器精简**：默认显示 `Model · Provider`；只有当你主动选了**非默认**推理等级时
  才附加 `· Effort`，不再浪费横向空间显示「Default」。
- **Esc 逐层返回**：Model → Provider → 主菜单 → 关闭（鼠标点顶部「‹」返回同样逐层退）。
- 触发器的 `Model · Provider [· Effort]` 与 Harness 会话状态完全一致。

## 工作原理

| 环节 | 说明 |
| --- | --- |
| 扩展点 | 官方 Slot 体系：conversation.input.model（single slot，session scope），非 DOM Hack |
| 覆盖方式 | 以 priority: -1 注册同名单 slot —— 该 slot 渲染最低 priority 的 entry，因此本组件胜出、原座位被 shadow |
| 数据 | 复用 Harness 原生的 modelDirectories 服务（每会话共享的 ModelDirectory），选择语义与禁选逻辑不变；Provider 列表直接来自 `state.groups`，失败列表来自 `state.failures` |
| 回退 | 插件卸载（slots.inject 的 effect 销毁）时注册消失，原模型座位立即原样恢复 |
| 命名空间 | 独立 locale 词典 modelProvider（zh/en），不侵入 Harness 文案 |

组件保留原 ModelSelect 的交互基线（共享目录与选择 RPC / 键盘上下键与 Esc / 失败重试与
Toast / 推理等级页），仅把**两级平铺**改为**三级导航**：

- 触发器：模型名 + · Provider（弱化样式）；仅在用户选择非默认推理等级时附加 · Effort；
  title 与 aria 同步带上 Provider
- 根菜单：模型（→ Provider 列表）、推理等级（→ 当前模型的 effort 列表）
- Provider 页：顶部「‹ 选择供应商」返回根菜单；搜索框过滤；当前供应商置顶并以文字标记
  「· 当前」（不做整行高亮）；每行显示「N 个模型」；失败的供应商渲染为可重试行
- Model 页：顶部「‹ {供应商名}」+「{N} 个模型」副标题；搜索框只过滤本供应商模型；
  选中行以 ✓ 标记（providerId + modelId 复合键判定，同名模型跨 Provider 不串）
- 默认推理等级：切到模型时自动把该模型的 `defaultEffort` 带进选择（`selectionFor` 是
  唯一构造 Selection 的入口，choice 预构建与点击路径语义一致）

## 目录

    dsh-model-provider/
    |- package.json            # dsh.client 声明（platform: web, inject 列表）
    |- pnpm-workspace.yaml     # pnpm 11 设置（批准 esbuild 构建脚本）
    |- build.mjs               # esbuild 打包脚本 → lib/client.js（ModuleLoader 格式）
    |- tsconfig.json           # noEmit 类型检查（src + test）
    |- src/
    |  |- index.ts             # Host 半区：空 apply（纯浏览器表面插件）
    |  |- client.tsx           # 客户端入口：apply() + slot 接线 + 兼容导出
    |  |- locale.ts            # modelProvider 词典（zh/en）
    |  |- model/
    |  |  ├─ types.ts          # 目录/选择 wire 类型
    |  |  └─ selection.ts      # 纯函数：selectionFor / sortGroupsForCurrent /
    |  |                       #  搜索过滤 / Esc 栈（UI 与测试共用）
    |  |- components/
    |  |  ├─ ModelSelector.tsx # 触发器 + 菜单壳 + 状态编排
    |  |  ├─ RootPane.tsx      # 第一层：模型 / 推理等级
    |  |  ├─ ProviderPane.tsx  # 第二层：供应商（搜索 + 失败行）
    |  |  ├─ ModelPane.tsx     # 第三层：单供应商模型（搜索 + 复合键）
    |  |  ├─ EffortPane.tsx    # 推理等级
    |  |  └─ StatusBlock.tsx   # 目录加载/错误横幅
    |  |- hooks/
    |  |  └─ useKeyboardNavigation.ts  # Esc 栈 + 方向键焦点
    |  └─ model-provider.css   # 作用域样式（dshmp- 前缀 + 设计令牌）
    |- test/model.test.ts      # node --test 单元测试（纯函数层）
    |- lib/                    # 构建产物（宿主伺服 /plugins/<id>/client.js）
    |- assets/icon.svg

## 构建

    pnpm install        # 首次：安装 esbuild / typescript（npm 亦可，见下）
    pnpm build          # node build.mjs → lib/client.js
    pnpm typecheck      # tsc --noEmit
    pnpm test           # node --test（无需 DOM，直接跑纯函数层）

构建脚本通过 `require.resolve("esbuild")` 使用本项目声明的 esbuild devDependency，
**不含任何本机硬编码路径**，可在任意机器构建。（若用 npm：`npm i && npm run build`，
提交的 lockfile 为 pnpm 生成，npm 会自行解析。）

产出为 DeepSeek Harness 客户端插件标准格式：

    window.__ModuleLoader__.load({ id: "dsh-model-provider", factory: (require) => { ... return module.exports; } });

## 安装到 Web Profile

> 正确姿势（v0.1.0 起）：本包已声明 `dsh.bundle.patch` + 自带 `cordis.patch.yml`，
> 属于标准 dsh 插件形状（与 dsh-balance-meter / dsh-context 一致）。不要再写成
> 「无元数据的 bundle」——那会触发启动检查报错：
> `profile bundle "dsh-model-provider" declares no dsh.bundle in its package.json` 并循环重启。

1. 依赖链接进 profile（/data/.dsh/profiles/web/package.json）：

       "dependencies": { "dsh-model-provider": "link:/data/opt/dev/dsh-provider-model" }
       "dsh": { "profile": { "bundles": [ ..., "dsh-model-provider" ] } }

   （用 dsh 官方 CLI 亦可：`dsh plugin --profile web add /data/opt/dev/dsh-provider-model`，
   它会按 dsh.bundle.patch 声明自动 reconcile 进 bundles。）

2. pnpm install（materialize link）
3. 重启 web 主机（client 插件集合变更以重启生效）：docker restart deepseek-harness 或等效的 dsh web 重启
4. 验证：

       curl -s http://127.0.0.1:3080/ | grep -o '"id":"dsh-model-provider"'
       curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3080/plugins/dsh-model-provider/client.js   # 200

   > 仅改 client.js（不加/删插件）时无需重启，重新 build 后刷新页面即可生效。

## 关闭插件 / 恢复原界面

从 dsh.profile.bundles 移除本包（或卸载插件）并重启 —— 原 ModelSelect 座位位次恢复为唯一 entry，界面还原。

## Roadmap

已交付（v0.3.0）：

- [x] 三级选择器：主菜单 → Provider 列表 → 单 Provider 的 Model 列表
- [x] 当前供应商置顶 + 「· 当前」文字标记（不做整行高亮）
- [x] 失败 Provider 作为可重试行（不再只有横幅）
- [x] Provider / Model 页行内搜索（单页过滤，不跨 Provider）
- [x] Model 页头部：‹ 供应商名 + N 个模型副标题
- [x] 触发器只在非默认推理等级时显示 · Effort（隐藏 Default）
- [x] 统一默认推理等级（selectionFor 单一构造点 + 测试覆盖）
- [x] 拆分 client.tsx（model / components / hooks / locale）
- [x] 构建清理：esbuild devDependency，去掉本机硬编码路径
- [x] node --test 单元测试（当前置顶 / 同名模型 / defaultEffort / Esc 栈 / 搜索过滤）

候选：

- 插件设置页（显示模式：纯分组 / 模型后跟 Provider / 两者；当前模型是否显示 Provider）
- 默认模型徽标（依赖 host wire 暴露 isDefault 字段）
- 最近使用 / 收藏 / 模型能力（上下文长度、价格）等展示增强
- Provider 图标

## License

MIT
