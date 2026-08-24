# dsh-model-provider

> DeepSeek Harness Model Selector UX Enhancement Plugin - 让模型选择器显式展示每个模型所属的 Provider。

在 DeepSeek Harness 的 Web 界面中，为编译器里的模型座位（composer model seat）补上 **Provider 信息**：

   启用前                      启用后（本插件）
   DeepSeek V4 Flash  Default    DeepSeek V4 Flash · OpenCode Go  Default

- 下拉目录本身已按 Provider 分组（粘性组标题），本插件补齐的是**当前模型区域**——触发器只显示模型名（+ 推理等级），同名模型跨 Provider 时无法区分来源。
- 插件的模型身份统一为 providerId:modelId（getModelKey），从不拿模型名当唯一 ID。

## 工作原理

| 环节 | 说明 |
| --- | --- |
| 扩展点 | 官方 Slot 体系：conversation.input.model（single slot，session scope），非 DOM Hack |
| 覆盖方式 | 以 priority: -1 注册同名单 slot —— 该 slot 渲染最低 priority 的 entry，因此本组件胜出、原座位被 shadow |
| 数据 | 复用 Harness 原生的 modelDirectories 服务（每会话共享的 ModelDirectory），选择语义与禁选逻辑不变 |
| 回退 | 插件卸载（slots.inject 的 effect 销毁）时注册消失，原模型座位立即原样恢复 |
| 命名空间 | 独立 locale 词典 modelProvider（zh/en），不侵入 Harness 文案 |

组件行为与原 ModelSelect 逐行等价（两级菜单 / 键盘导航 / 失败重试 / Toast / 推理等级），仅新增/修改：

- 触发器：模型名 + · Provider（弱化样式）+ 推理等级；title 与 aria 同步带上 Provider
- 目录行：title 工具提示改为 模型名 · Provider（组标题已按 Provider 分组）
- 选中判定、行 key 均为 providerId + modelId 复合键

## 目录

    dsh-model-provider/
    |- package.json            # dsh.client 声明（platform: web, inject 列表）
    |- build.mjs               # esbuild 构建脚本 → lib/client.js（ModuleLoader 格式）
    |- tsconfig.json
    |- src/
    |  |- index.ts             # host 半部（空 apply，纯浏览器面插件）
    |  |- client.tsx           # 客户端半部（组件 + apply 接线）
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

## 关闭插件 / 恢复原界面

从 dsh.profile.bundles 移除本包（或卸载插件）并重启 —— 原 ModelSelect 座位位次恢复为唯一 entry，界面还原。

## Roadmap（V0.1 之外的候选）

- 插件设置页（显示模式：纯分组 / 模型后跟 Provider / 两者；当前模型是否显示 Provider）
- 默认模型徽标（依赖 host wire 暴露 isDefault 字段）
- 搜索模式行内显示 Provider
- 最近使用 / 收藏 / 模型能力（上下文长度、价格）等展示增强

## License

MIT
