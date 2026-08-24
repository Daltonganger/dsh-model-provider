/**
 * dsh-model-provider - locale dictionaries (namespace owned by this plugin).
 */
export const NS = "modelProvider";

export const zh = {
  "trigger.fallback": "选择模型",
  "trigger.selectAria": "选择模型",
  "trigger.aria": "选择模型，当前 {model}（{provider}）",
  "trigger.ariaEffort": "选择模型，当前 {model}（{provider}），推理等级 {effort}",
  "menu.aria": "模型与推理等级",
  "menu.model": "模型",
  "menu.effort": "推理等级",
  "provider.header": "选择供应商",
  "provider.models": "{count} 个模型",
  "provider.current": "当前",
  "provider.aria": "{name}，{meta}",
  "provider.search": "搜索供应商",
  "provider.failed": "加载失败",
  "provider.failedDetail": "{name} 加载失败：{message}",
  "model.search": "搜索 {provider} 模型",
  "model.usecount": "{provider} 的 {count} 个模型",
  "effort.providerDefault": "Default",
  "status.loading": "正在刷新模型列表…",
  "error.action": "模型操作失败：{message}",
  "retry": "重新加载",
  "action.reload": "重新加载",
  "warning.groupLoad": "{name} 加载失败：{message}",
  "empty.models": "没有可用的模型。",
  "empty.search": "没有匹配的模型。",
  "empty.searchProviders": "没有匹配的供应商。",
  "empty.efforts": "当前模型未提供推理等级。"
};

export const en = {
  "trigger.fallback": "Select model",
  "trigger.selectAria": "Select model",
  "trigger.aria": "Select model, current {model} via {provider}",
  "trigger.ariaEffort": "Select model, current {model} via {provider}, reasoning effort {effort}",
  "menu.aria": "Model and reasoning effort",
  "menu.model": "Model",
  "menu.effort": "Effort",
  "provider.header": "Select provider",
  "provider.models": "{count} models",
  "provider.current": "current",
  "provider.aria": "{name}, {meta}",
  "provider.search": "Search providers",
  "provider.failed": "Failed to load",
  "provider.failedDetail": "{name} failed to load: {message}",
  "model.search": "Search {provider} models",
  "model.usecount": "{count} models from {provider}",
  "effort.providerDefault": "Default",
  "status.loading": "Refreshing model list…",
  "error.action": "Model operation failed: {message}",
  "retry": "Reload",
  "action.reload": "Reload",
  "warning.groupLoad": "{name} failed to load: {message}",
  "empty.models": "No models available.",
  "empty.search": "No matching models.",
  "empty.searchProviders": "No matching providers.",
  "empty.efforts": "This model provides no reasoning effort levels."
};
