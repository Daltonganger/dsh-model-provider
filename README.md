# dsh-model-provider

> Provider-first Model Selector — DeepSeek Harness 模型选择器插件。
> 先选择模型供应商，再选择该供应商下的模型；当前模型始终显示 `Model · Provider`，
> 但不改变 DeepSeek Harness 原有模型调用和会话状态逻辑。

在 DeepSeek Harness 的 Web 界面中，把编译器里的模型座位（composer model seat）从
「Provider 分组 + 全模型展开」升级为 **三级选择器**：

   启用前                    启用后（本插件 v0.2.0）
   DeepSeek V4 Flash          DeepSeek V4 Flash · OpenCode Go  Default

试试打开下拉（模型很多也不乱）：

    第一层（主菜单）            第二层（Provider）            第三层（Model）
    ├─ 模型   DeepSeek V4 Flash >   ├─ opencode-go  8 个模型 · 当前 >   opencode-go
    └─ 推理等级 Default           >   ├─ luckikey     2 个模型       >   ├─ MiniMax-M3
                                        ├─ OpenRouter  20 个模型      >   ├─ Qwen3.7 Max
                                        └─ DeepSeek     4 个模型       >   ├─ DeepSeek V4 Flash ✓
                                                                           ├─ DeepSeek V4 Pro
                                                                           └─ GLM-5.1

- Provider 列表把**当前供应商置顶**并标出「· 当前」，一眼知道自己走的是哪个供应商；
  其余供应商保持目录顺序。
- Model 页只渲染选中供应商的模型，不再一次性平铺所有 Provider × Model。
- **Esc 逐层返回**：Model → Provider → 主菜单 → 关闭（鼠标点顶部「‹」返回同样逐层退）。
- 触发器的 `Model · Provider · Effort` 与 Harness 会话状态完全一致。

## 工作原理

| 环节 | 说明 |
| --- | --- |
| 扩展点 | 官方 Slot 体系：conversation.input.model（single slot，session scope），非 DOM Hack |
| 覆盖方式 | 以 priority: -1 注册同名单 slot —— 该 slot 渲染最低 priority 的 entry，因此本组件胜出、原座位被 shadow |
| 数据 | 复用 Harness 原生的 modelDirectories 服务（每会话共享的 ModelDirectory），选择语义与禁选逻辑不变；Provider 列表直接来自 `state.groups`，无需另建数据源 |
| 回退 | 插件卸载（slots.inject 的 effect 销毁）时注册消失，原模型座位立即原样恢复 |
| 命名空间 | 独立 locale 词典 modelProvider（zh/en），不侵入 Harness 文案 |

组件保留原 ModelSelect 的交互基线（共享目录与选择 RPC / 键盘上下键与 Esc / 失败重试与
Toast / 推理等级页），仅把**两级平铺**改为**三级导航**：

- 触发器：模型名 + · Provider（弱化样式）+ 推理等级；title 与 aria 同步带上 Provider
- 根菜单：模型（→ Provider 列表）、推理等级（→ 当前模型的 effort 列表）
- Provider 页：顶部「‹ 选择供应商」返回根菜单；当前供应商置顶并高亮「· 当前」；
  每行显示「N 个模型」，点击进入该供应商的 Model 页
- Model 页：顶部「‹ {供应商名}」返回 Provider 页；只渲染该供应商的模型；
  选中行以 ✓ 标记（providerId + modelId 复合键判定）
- 目录行选中判定、行 key 均为 providerId + modelId 复合键

## 目录

    dsh-model-provider/
    |- package.json            # dsh.client 声明（platform: web, inject 列表）
    |- build.mjs               # esbuild 构建脚本 → lib/client.js（ModuleLoader 格式）
    |- tsconfig.json
    |- src/
    |  |- index.ts             # host 半部（空 apply，纯浏览器面插件）
    |  |- client.tsx           # 客户端半部（三级选择器组件 + apply 接线）
    |  |- model-provider.css   # 作用域样式（dshmp- 前缀 + 设计令牌）
    |- lib/                    # 构建产物（宿主伺服 /plugins/<id>/client.js）
    |- assets/icon.svg

## 构建

    node build.mjs            # 生成 lib/client.js（依赖本机任一路径的 esbuild）

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

已交付（v0.2.0）：

- [x] 三级选择器：主菜单 → Provider 列表 → 单 Provider 的 Model 列表
- [x] 当前供应商置顶 + 「· 当前」标记
- [x] Esc / 返回键逐层退出；切页后焦点落到新页首项（键盘可继续方向键选择）

候选：

- 插件设置页（显示模式：纯分组 / 模型后跟 Provider / 两者；当前模型是否显示 Provider）
- 默认模型徽标（依赖 host wire 暴露 isDefault 字段）
- 搜索模式行内显示 Provider
- 最近使用 / 收藏 / 模型能力（上下文长度、价格）等展示增强

## License

MIT
