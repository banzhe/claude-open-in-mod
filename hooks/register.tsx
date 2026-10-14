import type { EngineInterface, Register } from 'claude-code'

// cmd.exe treats these as syntax even inside an argument, so a path holding
// one is never handed to the Windows fallback.
const CMD_UNSAFE = /["&|<>^%!]/

/**
 * Opens `root` with the editor command; resolves an error text, or undefined
 * on success. `code` is a batch script on Windows (`code.cmd`), which a
 * no-shell spawn cannot start, so there it runs through cmd.exe.
 */
async function openWorkspace($: EngineInterface, command: string, root: string): Promise<string | undefined> {
  const isWindows = (await $.env.get('OS')) === 'Windows_NT'
  if (isWindows && (CMD_UNSAFE.test(root) || CMD_UNSAFE.test(command))) {
    return `路径或命令含有 cmd.exe 无法安全传递的字符：${root}`
  }

  const argv = isWindows ? ['cmd.exe', '/d', '/c', command, root] : [command, root]
  let reason: string
  try {
    const { exitCode, stderr } = await $.process.run(argv, { timeoutMs: 20_000 })
    if (exitCode === 0) {
      return undefined
    }
    reason = stderr.trim() || `退出码 ${exitCode}`
  } catch (error) {
    reason = error instanceof Error ? error.message : String(error)
  }

  return `无法运行 \`${command}\`（${reason}）。请确认 VS Code 的 \`${command}\` 命令已加入 PATH。`
}

let isOpening = false

/** Opens the session's project root, toasting only a failure; resolves the outcome's text. */
async function open($: EngineInterface, command: string): Promise<string> {
  if (isOpening) {
    return '正在打开…'
  }
  isOpening = true
  try {
    const root = await $.session.root()
    const failure = await openWorkspace($, command, root)
    if (failure !== undefined) {
      $.ui.toast(failure)
      return failure
    }
    return `已在 VS Code 中打开 ${root}`
  } finally {
    isOpening = false
  }
}

export const register: Register = (on, options) => {
  const command = typeof options.command === 'string' && options.command.trim() !== ''
    ? options.command.trim()
    : 'code'
  // `footer`: beside the mode labels at the right of the prompt footer, the
  // nearest hookable site to the permission select; `band`: above the prompt.
  const placement = options.placement === 'band' || options.placement === 'both'
    ? options.placement
    : 'footer'

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'vscode',
      description: '在 VS Code 中打开当前工作区',
    })

    return next(e)
  })

  on('command.run', { command: 'vscode' }, async $ => ({ text: await open($, command) }))

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (placement === 'band') {
      return next(e)
    }

    const modes = e.props.modes.length > 0 ? e.props.modes.join(' & ') : undefined

    // A desktop draws every Button with its native chrome, `plain` or not, and
    // draws no Client in this footer slot; `dimColor` keeps it quiet at rest.
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={1}>
        {modes !== undefined && <Text dimColor>{modes}</Text>}
        <Button key="open-in-vscode" label="VS Code" plain dimColor onPress={() => void open($, command)} />
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (placement === 'footer' || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const root = await $.session.root()

    return (
      <Box flexDirection="row" gap={1}>
        <Button
          key="open-in-vscode"
          label="在 VS Code 中打开"
          hotkey="v"
          onPress={() => void open($, command)}
        />
        <Text dimColor wrap="truncate-start">
          {root}
        </Text>
      </Box>
    )
  })
}
