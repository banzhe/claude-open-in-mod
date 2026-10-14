import { expect, mock, test } from 'claude-code/testing'

const ROOT = 'D:/work/project'

const BAND = {
  plugin: 'open-in-vscode',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

const FOOTER = {
  plugin: 'open-in-vscode',
  component: 'SessionMode',
  props: { modes: ['focus'] },
} as const

test('the footer button keeps the mode labels and opens the workspace', async ($, on) => {
  mock.env(on, { OS: 'Windows_NT' })
  const runs: (readonly string[])[] = []
  on('session.root', () => ({ value: ROOT }))
  on('process.run', (_$, e) => {
    runs.push(e.argv)
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.toast', () => ({ value: undefined }))

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...FOOTER, surface })
    expect(await ui.find({ type: 'Text', text: 'focus' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'open-in-vscode' })).toBeDefined()
    await ui.press({ key: 'open-in-vscode' })
    await ui.unmount()
  }

  expect(runs.length).toBe(2)
})

test('the band button opens the workspace through cmd.exe on Windows', { options: { placement: 'band' } }, async ($, on) => {
  mock.env(on, { OS: 'Windows_NT' })
  const runs: (readonly string[])[] = []
  const toasts: string[] = []
  on('session.root', () => ({ value: ROOT }))
  on('process.run', (_$, e) => {
    runs.push(e.argv)
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })


  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ key: 'open-in-vscode' })).toBeDefined()
    await ui.press({ key: 'open-in-vscode' })
    await ui.unmount()
  }

  expect(runs).toEqual([
    ['cmd.exe', '/d', '/c', 'code', ROOT],
    ['cmd.exe', '/d', '/c', 'code', ROOT],
  ])
  expect(toasts).toEqual([])
})

test('runs the editor directly elsewhere and reports a failure', async ($, on) => {
  mock.env(on, {})
  const runs: (readonly string[])[] = []
  on('session.root', () => ({ value: ROOT }))
  on('process.run', (_$, e) => {
    runs.push(e.argv)
    return { value: { exitCode: 1, stdout: '', stderr: 'not found', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.toast', () => ({ value: undefined }))

  const result = await $.command.run({
    command: 'vscode',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })

  expect(runs).toEqual([['code', ROOT]])
  expect(JSON.stringify(result)).toContain('not found')
})

test('yields the band to a survey', { options: { placement: 'both' } }, async ($, on) => {
  on('session.root', () => ({ value: ROOT }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>survey</Text>
  })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, hasSurvey: true } })
  expect(await ui.find({ key: 'open-in-vscode' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'survey' })).toBeDefined()
  await ui.unmount()
})
