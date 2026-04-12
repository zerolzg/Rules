# rule-converter

Clash 配置生成工具，前端生成 + 后端格式化。

## 启动

```bash
npm install
node proxy.js
```

访问 `http://localhost:5555`

## 功能

- 输入订阅 URL（每行一个，格式 `前缀|URL`，前缀留空则无前缀）或手动粘贴节点 YAML
- 点击 **生成配置** 拉取订阅并解析节点
- **预览** 自动刷新，后端统一格式化
- **Download** 下载本地文件
- **Copy** 复制到剪贴板
- **Save to Server** 保存到服务器，生成订阅 URL

## 配置编辑

- `# head.yaml` — 头部配置（port、dns、allow-lan 等）
- `R rules.yaml` — 规则配置（rules、rule-providers 等）

## 格式化规则

后端使用 `yaml` 库处理：

- `proxies`、`proxy-groups` 数组里的每个节点 flow 单行
- `rule-providers` 下的每个 provider flow 单行
- 其余顶级 section（dns、rules 等）保持 block 格式

## API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/generate` | POST | 构建 + 格式化 YAML，保存到服务器 |
| `/api/sub?key=<KEY>` | GET | 下载已保存的 config.yaml |
| `/api/info` | GET | 返回订阅地址 |
| `/proxy?<url>` | GET | 订阅代理转发 |
