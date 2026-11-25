# Clash Rules Generator

一个把订阅与手动节点合并生成 Clash 配置的纯前端工具：拉取订阅、叠加前缀、套用策略组模板，产出可直接导入 Clash 的 config.yaml，并生成供客户端订阅的地址。

## Language

### 输入

**Subscription（订阅）**:
一个远程 URL，返回一份代理节点列表，经本地服务端拉取后并入配置。
_Avoid_: 订阅源、feed、source URL

**Prefix（前缀）**:
附加在某条订阅所有节点名之前的标签，形如 `prefix - name`，用于区分节点来源。
_Avoid_: tag、别名

**Manual Proxy（手动节点）**:
直接粘贴在 Manual YAML 里、不经订阅拉取的节点。
_Avoid_: 自定义节点、本地节点

**Head / Rules（头部与规则）**:
合并进最终配置的两段可编辑 YAML 片段，分别构成配置的头部与分流规则。
_Avoid_: 模板、默认配置

### 生成

**Merged Config（合并配置）**:
由 Head、Rules、全部节点与策略组模板合成的一份完整 Clash 配置。
_Avoid_: 输出、成品

**Proxy Group（策略组）**:
一组命名好的节点选择器，由固定模板生成，分流规则按名字指向它。
_Avoid_: policy group、组

**Server（本地服务端）**:
提供订阅拉取、配置格式化与订阅地址的本地 Node 服务；与「代理节点」里的 proxy 无关。
_Avoid_: proxy、代理（易与代理节点混淆）

### 输出

**Live Preview（实时预览）**:
合并配置经服务端格式化后的只读渲染结果，随输入变化刷新。
_Avoid_: 输出面板、结果区

**Subscription URL（订阅地址）**:
保存到服务端后生成的 URL，填进 Clash 客户端即可订阅本配置。
_Avoid_: 分享链接、sub 链接

**Dirty（未保存）**:
自上次成功保存以来输入发生过变化的标记状态。
_Avoid_: 已修改、待保存
