# open-in-vscode

Claude Code（含 Desktop 的 Code 标签页）的一个 mod：增加一个 **VS Code** 按钮，点击后用 VS Code 打开当前会话的工作区（项目根目录）。

- 按钮位置由 `placement` 配置：
  - `footer`（默认）：输入框底栏右侧的模式标签处（`SessionMode`），最靠近权限选择器的可挂载位置
  - `band`：输入框上方的横条（`AbovePrompt`），聚焦横条后可按 `v` 触发
  - `both`：两处都显示
- 斜杠命令：`/vscode`
- 成功时静默打开；失败时用 toast 说明原因（多半是 `code` 不在 PATH 中）

## 前提

VS Code 的 `code` 命令需在 PATH 中（VS Code 命令面板 → *Shell Command: Install 'code' command in PATH*；Windows 安装器默认已添加）。

## 使用

开发时直接从本目录加载：

```bash
claude --plugin-dir D:/personal/claude-open-in-mod
```

Desktop 应用启动的会话无法传参，可在 `~/.claude/settings.json` 中设置：

```json
{ "env": { "CLAUDE_CODE_PLUGIN_DIRS": "D:/personal/claude-open-in-mod" } }
```

或推送到 GitHub 后在终端会话里安装（用户范围安装后 Desktop 会话同样生效）：

```bash
/plugin install open-in-vscode --marketplace <owner>/<repo>
```

## 配置

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `command` | `code` | 用来打开工作区的命令，可改为 `code-insiders`、`cursor` 等 |
| `placement` | `footer` | 按钮位置：`footer` / `band` / `both` |

在 `/config` 中修改，或写入 settings 的 `pluginConfigs["open-in-vscode"].options.command`。

## 开发

```bash
claude plugin validate .
claude plugin test .
```

Windows 上 `code` 是批处理脚本（`code.cmd`），因此通过 `cmd.exe /d /c code <root>` 启动；路径中含 `" & | < > ^ % !` 时会拒绝执行以避免命令注入。
