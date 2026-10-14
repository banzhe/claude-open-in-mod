# open-in-vscode

一个 Claude Code mod（同样适用于 Claude Desktop 的 Code 标签页）：在界面上增加一个 **VS Code** 按钮，一键用 VS Code 打开当前会话的工作区（项目根目录）。

项目地址：<https://github.com/banzhe/claude-open-in-mod>

## 功能

- **一键打开**：点击按钮即用编辑器打开当前会话的项目根目录
- **可选位置**：按钮可放在输入框底栏、输入框上方横条，或两处同时显示
- **斜杠命令**：输入 `/vscode` 即可打开
- **可换编辑器**：支持 `code-insiders`、`cursor` 等任意兼容 `code` 用法的命令
- **安静可靠**：成功时静默打开；失败时用 toast 提示原因

## 前提

编辑器命令（默认 `code`）需在 `PATH` 中：

- **macOS / Linux**：在 VS Code 命令面板执行 *Shell Command: Install 'code' command in PATH*
- **Windows**：安装器默认已添加

## 安装

在 Claude Code 中添加 marketplace 并安装插件：

```bash
/plugin marketplace add banzhe/claude-open-in-mod
/plugin install open-in-vscode@claude-open-in-mod
```

以用户范围安装后，Desktop 应用中的会话同样生效。

### 从本地源码加载

克隆仓库后，可直接从源码目录加载（适合开发调试）：

```bash
git clone https://github.com/banzhe/claude-open-in-mod.git
claude --plugin-dir ./claude-open-in-mod
```

Desktop 应用启动的会话无法传命令行参数，可在 `~/.claude/settings.json` 中设置环境变量：

```json
{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "/path/to/claude-open-in-mod" } }
```

## 配置

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `command` | `code` | 用来打开工作区的命令，可改为 `code-insiders`、`cursor` 等 |
| `placement` | `footer` | 按钮位置：`footer` / `band` / `both` |

`placement` 取值说明：

- `footer`（默认）：输入框底栏右侧的模式标签处（`SessionMode`），最靠近权限选择器的可挂载位置
- `band`：输入框上方的横条（`AbovePrompt`），聚焦横条后按 `v` 即可触发
- `both`：两处都显示

可在 `/config` 中修改，或直接写入 settings：

```json
{
  "pluginConfigs": {
    "open-in-vscode": {
      "options": { "command": "cursor", "placement": "both" }
    }
  }
}
```

## 常见问题

**点击后提示失败？** 多半是编辑器命令不在 `PATH` 中，参见[前提](#前提)。修改 `PATH` 后需要重启 Claude Code。

**Windows 下的实现说明**：`code` 在 Windows 上是批处理脚本（`code.cmd`），因此通过 `cmd.exe /d /c code <root>` 启动。为避免命令注入，若路径中含有 `" & | < > ^ % !` 等字符会拒绝执行。

## 开发

```bash
claude plugin validate .
claude plugin test .
```

主要文件：

- `hooks/register.tsx` — mod 入口：按钮、斜杠命令与启动逻辑
- `tests/open-in-vscode.test.tsx` — 测试
- `.claude-plugin/plugin.json` — 插件清单与配置项定义
