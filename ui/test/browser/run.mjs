import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const ui = path.resolve(here, '../..')
const root = path.dirname(ui)
const artifacts = mkdtempSync(path.join(tmpdir(), 'quartizo-ui-regression-'))
const bundle = path.join(artifacts, 'app.js')
const python = process.env.PYTHON || (existsSync(path.join(root, '.venv/bin/python')) ? path.join(root, '.venv/bin/python') : 'python3')
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const executablePath = process.env.QUARTIZO_BROWSER_EXECUTABLE || (process.platform === 'darwin' && existsSync(chrome) ? chrome : undefined)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function eventually(check, message) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (await check()) return
    await delay(100)
  }
  throw new Error(message)
}
const textbox = (page, name) => page.getByRole('textbox', { name, exact: true })
const button = (page, name) => page.getByRole('button', { name, exact: true })
const tab = (page, name) => page.getByRole('tab', { name, exact: true })
const select = (page, name) => page.getByRole('combobox', { name, exact: true })
const noteView = (page, name) => page.getByRole('radio', { name, exact: true })

async function startFixture(hostVersion = '0.12.0') {
  const process = spawn(python, [path.join(here, 'bridge.py'), '--bundle', bundle, '--host-version', hostVersion], {
    cwd: root, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stderr = ''
  process.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-15000) })
  const line = await new Promise((resolve, reject) => {
    readline.createInterface({ input: process.stdout }).once('line', resolve)
    process.once('error', reject)
    process.once('exit', code => reject(new Error(`Fixture exited ${code}: ${stderr}`)))
  })
  return {
    ...JSON.parse(line),
    async stop() {
      if (process.exitCode !== null) return
      const ended = once(process, 'exit')
      process.kill('SIGTERM')
      const timeout = setTimeout(() => process.kill('SIGKILL'), 3000)
      await ended
      clearTimeout(timeout)
    },
  }
}

async function ready(page, name = 'First') {
  await eventually(() => select(page, `Move ${name} to column`).isEnabled().catch(() => false), `Ticket ${name} did not become editable`)
}

async function draftAndRequestRegression(page, fixture) {
  await page.goto(fixture.origin)
  await ready(page)
  await button(page, 'New ticket').click()
  await textbox(page, 'Ticket note path').fill('draft.md')
  await textbox(page, 'Ticket title').fill('Draft title')
  await textbox(page, 'Ticket description').fill('Important unsaved description')
  await tab(page, 'TODOs').click()
  await tab(page, 'Tasks').click()
  assert.equal(await textbox(page, 'Ticket title').inputValue(), 'Draft title')
  assert.equal(await textbox(page, 'Ticket description').inputValue(), 'Important unsaved description')
  await button(page, 'Use existing note').click()
  await textbox(page, 'Ticket note path').fill('ordinary.md')
  await button(page, 'New ticket').click()
  assert.equal(await textbox(page, 'Ticket title').inputValue(), 'Draft title')
  await select(page, 'Workspace').selectOption({ label: 'Other vault' })
  await button(page, 'New ticket').click()
  await textbox(page, 'Ticket title').fill('Other workspace draft')
  await select(page, 'Workspace').selectOption({ label: 'Browser vault' })
  assert.equal(await textbox(page, 'Ticket title').inputValue(), 'Draft title')

  let release
  let intercepted
  const paused = new Promise(resolve => { release = resolve })
  const entered = new Promise(resolve => { intercepted = resolve })
  await page.route('**/tickets', async route => { intercepted(); await paused; await route.continue() })
  await ready(page)
  const response = page.waitForResponse(value => value.url().endsWith('/tickets'))
  await button(page, 'Create ticket').click()
  await entered
  await tab(page, 'TODOs').click()
  release()
  await eventually(() => existsSync(path.join(fixture.vault, 'draft.md')), 'Request stopped after leaving Tasks')
  assert.equal((await response).status(), 201)
  await delay(150)
  await tab(page, 'Tasks').click()
  await ready(page, 'Draft title')
  assert.equal(await button(page, 'Create ticket').count(), 0, 'Successful hidden request left the old form open')
  await select(page, 'Workspace').selectOption({ label: 'Other vault' })
  assert.equal(await textbox(page, 'Ticket title').inputValue(), 'Other workspace draft')
  await select(page, 'Workspace').selectOption({ label: 'Browser vault' })
  await page.unroute('**/tickets')
  console.log('PASS draft preservation across tabs, modes, workspaces and request completion')
}

async function selfDropRegression(page, fixture) {
  await ready(page)
  const before = readFileSync(path.join(fixture.vault, 'second.md'))
  let moves = 0
  const countMove = request => { if (request.url().endsWith('/tickets/move')) moves++ }
  page.on('request', countMove)
  const card = page.locator('li').filter({ has: button(page, 'Open note: Second') })
  await card.dragTo(card, { sourcePosition: { x: 25, y: 15 }, targetPosition: { x: 110, y: 45 } })
  await delay(500)
  assert.equal(moves, 0, 'Self-drop sent a mutation')
  assert.deepEqual(readFileSync(path.join(fixture.vault, 'second.md')), before)
  assert.equal(await page.getByRole('region', { name: 'Ready', exact: true }).getByRole('button', { name: /Open note:/ }).first().getAttribute('aria-label'), 'Open note: First')
  page.off('request', countMove)
  console.log('PASS native mouse self-drop is a no-op')
}

async function cancelledPreviewRegression(page, fixture) {
  await page.goto(fixture.origin)
  await ready(page)
  let release
  let intercepted
  const paused = new Promise(resolve => { release = resolve })
  const entered = new Promise(resolve => { intercepted = resolve })
  await page.route('**/source?*', async route => {
    intercepted()
    await paused
    await route.continue()
  }, { times: 1 })
  const form = page.getByRole('region', { name: 'Use existing note', exact: true })
  await button(page, 'Use existing note').click()
  await textbox(page, 'Ticket note path').fill('ordinary.md')
  const response = page.waitForResponse(value => new URL(value.url()).pathname.endsWith('/source'))
  await button(page, 'Preview note').click()
  await entered
  await button(page, 'Cancel').click()
  await button(page, 'Use existing note').click()
  release()
  assert.equal((await response).status(), 200)
  await delay(150)
  assert.equal(await textbox(page, 'Ticket note path').inputValue(), '')
  assert.equal(await form.locator('pre').count(), 0, 'Cancelled note preview reappeared')
  await textbox(page, 'Ticket note path').fill('ordinary.md')
  await button(page, 'Preview note').click()
  await form.locator('pre').waitFor()
  await button(page, 'Cancel').click()
  console.log('PASS cancelling an in-flight note preview discards its response')
}

async function rebalance(page) {
  await button(page, 'Review column…').click()
  await button(page, 'Rebalance column').click()
  await eventually(() => button(page, 'Rebalance column').count().then(count => count === 0), 'Rebalance did not finish')
}

async function exhaustionRegression(page, fixture) {
  const first = path.join(fixture.vault, 'first.md')
  const exhausted = 'f'.repeat(31) + 'e'
  writeFileSync(first, readFileSync(first, 'utf8').replace('status: ready', 'status: backlog').replace(/order: "[a-f0-9]{32}"/, `order: "${exhausted}"`))
  await button(page, 'Refresh').click()
  await eventually(async () => await select(page, 'Move First to column').isEnabled() && await select(page, 'Move First to column').inputValue() === 'backlog', 'Exhaustion fixture did not refresh')
  await button(page, 'New ticket').click()
  await textbox(page, 'Ticket note path').fill('exhaustion.md')
  await textbox(page, 'Ticket title').fill('Recovered creation')
  await button(page, 'Create ticket').click()
  await page.getByRole('alert').filter({ hasText: 'rebalancing' }).waitFor()
  await button(page, 'Review column…').waitFor()
  await rebalance(page)
  await button(page, 'Create ticket').click()
  await ready(page, 'Recovered creation')

  const created = path.join(fixture.vault, 'exhaustion.md')
  writeFileSync(created, readFileSync(created, 'utf8').replace(/order: "[a-f0-9]{32}"/, `order: "${exhausted}"`))
  await button(page, 'Refresh').click()
  await ready(page, 'Recovered creation')
  await button(page, 'Use existing note').click()
  assert.equal(await textbox(page, 'Ticket note path').inputValue(), 'ordinary.md', 'Promotion draft was not retained')
  await button(page, 'Preview note').click()
  await eventually(() => button(page, 'Make ticket').isEnabled(), 'Promotion preview did not load')
  assert.equal(await page.locator('img').count(), 0)
  await button(page, 'Make ticket').click()
  await page.getByRole('alert').filter({ hasText: 'rebalancing' }).waitFor()
  await rebalance(page)
  await button(page, 'Make ticket').click()
  await ready(page, 'Ordinary')
  assert.match(readFileSync(path.join(fixture.vault, 'ordinary.md'), 'utf8'), /custom: "keep" # comment/)
  assert.equal(await page.evaluate(() => Boolean(window.hostileExecuted)), false)
  console.log('PASS create and promote recover from exhausted ranks without losing drafts')
}

async function migrationRegression(page, fixture) {
  await tab(page, 'Settings').click()
  await button(page, 'Preview migration').click()
  await button(page, 'Back up and migrate').click()
  await page.getByText('1 ticket note(s) migrated. Migration verified.', { exact: true }).waitFor()
  const journalPath = path.join(fixture.data, readdirSync(fixture.data).find(name => /^migration-[a-f0-9]+\.json$/.test(name)))
  const journal = JSON.parse(readFileSync(journalPath, 'utf8'))
  // This is the exact durable state after all file steps, before the final
  // completion record. Simulate a process interruption at that boundary.
  journal.complete = false
  writeFileSync(journalPath, JSON.stringify(journal))
  const renamed = path.join(fixture.vault, 'renamed-converted.md')
  renameSync(path.join(fixture.vault, 'Quartizo tickets', 'd'.repeat(32) + '.md'), renamed)
  writeFileSync(renamed, readFileSync(renamed, 'utf8') + '\nMy external writing\n')
  await button(page, 'Preview migration').click()
  const dialog = page.getByRole('alertdialog', { name: 'Confirm old task migration' })
  assert.match(await dialog.innerText(), /renamed-converted.md/)
  await dialog.getByRole('checkbox').check()
  await button(page, 'Resume and verify migration').click()
  await page.getByText('1 ticket note(s) migrated. Migration verified.', { exact: true }).waitFor()
  assert.equal(JSON.parse(readFileSync(journalPath, 'utf8')).complete, true)
  assert.match(readFileSync(renamed, 'utf8'), /My external writing\n$/)
  console.log('PASS renamed and edited migration output exposes consent and resumes')
}

async function customColumnsRegression(page, fixture) {
  const folder = page.getByRole('region', { name: 'Browser vault', exact: true })
  const disclosure = name => folder.locator('summary').filter({ hasText: new RegExp(`^${name}$`) })
  await disclosure('Board columns').click()
  await textbox(folder, 'Name for ready').fill('Up next')
  await button(folder, 'Move column ready up').click()
  await textbox(folder, 'New column name').fill('On hold')
  assert.equal(await textbox(folder, 'New status ID').inputValue(), 'on_hold')
  await button(folder, 'Add column').click()
  await button(folder, 'Save columns').click()
  await folder.getByText('Board columns saved.', { exact: true }).waitFor()
  await disclosure('Agent instructions').click()
  const prompt = await textbox(folder, 'Agent prompt').inputValue()
  assert.ok(prompt.includes(fixture.vault))
  assert.match(prompt, /- ready \("Up next"\)[\s\S]*- on_hold \("On hold"\)/)
  assert.match(prompt, /status: "ready"/)
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await button(folder, 'Copy agent prompt').click()
  await folder.getByText('Agent prompt copied.', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), prompt)
  assert.equal(await page.evaluate(() => window.testChatLaunch), undefined)
  await button(folder, 'Ask a Bot or agent').click()
  assert.deepEqual(await page.evaluate(() => window.testChatLaunch), { message: prompt, autoSend: false })

  await tab(page, 'Tasks').click()
  const board = page.getByRole('group', { name: 'Board of Browser vault' })
  const lane = name => board.getByRole('region', { name, exact: true })
  await lane('On hold').waitFor()
  assert.equal(await board.getByRole('region').first().getAttribute('aria-label'), 'Up next')
  await ready(page)
  await button(page, 'New ticket').click()
  assert.equal(await select(page, 'Initial status').inputValue(), 'ready')
  await select(page, 'Initial status').selectOption('on_hold')
  await textbox(page, 'Ticket note path').fill('hold.md')
  await textbox(page, 'Ticket title').fill('Held ticket')
  await textbox(page, 'Ticket description').fill('- [ ] Held task')
  await button(page, 'Create ticket').click()
  await button(lane('On hold'), 'Open note: Held ticket').waitFor()
  const file = path.join(fixture.vault, 'hold.md')
  const original = readFileSync(file, 'utf8')
  assert.match(original, /status: "on_hold"/)

  await tab(page, 'TODOs').click()
  await page.getByRole('heading', { name: 'Held ticket On hold', exact: true }).waitFor()
  await tab(page, 'Settings').click()
  await disclosure('Board columns').click()
  await button(folder, 'Remove column on_hold').click()
  await button(folder, 'Save columns').click()
  await folder.getByText('Board columns saved.', { exact: true }).waitFor()
  assert.equal(readFileSync(file, 'utf8'), original)
  await tab(page, 'Tasks').click()
  await button(lane('Needs repair'), 'Open note: Held ticket').waitFor()
  await ready(page, 'Held ticket')
  await select(page, 'Move Held ticket to column').selectOption('ready')
  await button(lane('Up next'), 'Open note: Held ticket').waitFor()
  assert.match(readFileSync(file, 'utf8'), /status: "ready"/)

  await page.reload()
  await lane('Up next').waitFor()
  assert.equal(await lane('On hold').count(), 0)
  await select(page, 'Workspace').selectOption({ label: 'Other vault' })
  await page.getByRole('group', { name: 'Board of Other vault' }).getByRole('region', { name: 'Ready', exact: true }).waitFor()
  console.log('PASS custom columns persist per folder, keep notes recoverable, and reach the clipboard and unsent chat draft')
}

async function notesRegression(page, fixture) {
  let automaticRescans = 0
  const countRescan = request => {
    if (request.method() === 'POST' && request.url().endsWith('/companion/refresh')) automaticRescans++
  }
  page.on('request', countRescan)
  try {
    await page.goto(fixture.origin)
    // KiroCrew mounts routed apps inside a height-constrained flex column.
    await page.addStyleTag({ content: '#root { display: flex; flex-direction: column; height: calc(100vh - 48px); overflow: auto; } svg { display: block; }' })
    await select(page, 'Workspace').selectOption({ label: 'Browser vault' })
    await button(page, 'Open note: First').click()
    const editor = textbox(page, 'Note Markdown')
    const preview = page.getByLabel('Markdown preview')
    await preview.getByRole('heading', { name: 'First', exact: true }).waitFor()
    assert.equal(await preview.evaluate(element => getComputedStyle(element).fontSize), '16px')
    const readingWidth = await preview.evaluate(element => element.getBoundingClientRect().width)
    await button(page, 'Reading width').click()
    assert.ok(await preview.evaluate(element => element.getBoundingClientRect().width) > readingWidth)
    await noteView(page, 'Raw').click()
    await eventually(async () => (await editor.inputValue().catch(() => '')).includes('# First'), 'Task did not open its source note')
    const viewport = page.viewportSize()
    try {
      for (const size of [viewport, { width: 390, height: 1500 }]) {
        await page.setViewportSize(size)
        const remaining = await editor.evaluate(element =>
          document.getElementById('root').getBoundingClientRect().bottom - element.getBoundingClientRect().bottom)
        assert.ok(remaining >= 0 && remaining < 90, `Raw editor did not fill the pane at ${size.width}px (${remaining}px left)`)
      }
    } finally {
      await page.setViewportSize(viewport)
    }
    assert.equal(await select(page, 'Notes folder').inputValue(), String(fixture.workspaceId))
    await tab(page, 'TODOs').click()
    await button(page, 'Open note: First TODO').click()
    assert.match(await editor.inputValue(), /- \[ \] First TODO/)

    await button(page, 'New note').click()
    await textbox(page, 'Note path').fill('Projects/notes-regression.md')
    await button(page, 'Create note').click()
    const notePath = path.join(fixture.vault, 'Projects', 'notes-regression.md')
    await eventually(() => existsSync(notePath), 'Nested note was not created')
    await page.locator('code[title="Projects/notes-regression.md"]').waitFor()
    const folder = page.locator('summary[title="Projects"]')
    await folder.waitFor()
    const rowCenters = await folder.evaluate(element => Array.from(element.children, child => {
      const { top, height } = child.getBoundingClientRect()
      return Math.round(top + height / 2)
    }))
    assert.equal(rowCenters.length, 3)
    assert.equal(new Set(rowCenters).size, 1, 'Folder arrow, icon, and name should share a row')
    await folder.press('Enter')
    assert.equal(await folder.evaluate(element => element.parentElement.open), false)
    await folder.press('Enter')
    assert.equal(await folder.evaluate(element => element.parentElement.open), true)
    let saved = '---\ntitle: Notes regression\n---\n# Notes regression\n\nEditable body.\n\n- [ ] Shared index check\n\n```js\nconst value = 1\n```\n\n<script>window.hostileExecuted = true</script>\n\n![pixel](https://example.com/pixel.png)\n'
    await editor.fill(saved)
    assert.notEqual(readFileSync(notePath, 'utf8'), saved, 'Raw note was saved before leaving the editor')
    await tab(page, 'Settings').click()
    await eventually(() => readFileSync(notePath, 'utf8') === saved, 'Clicking away from Raw did not save the note')
    await tab(page, 'Notes').click()
    assert.equal(await editor.inputValue(), saved)
    await noteView(page, 'Rendered').click()
    await page.getByRole('heading', { name: 'Notes regression', exact: true }).waitFor()
    assert.equal(await page.locator('img').count(), 0, 'Preview rendered a remote image')
    assert.equal(await page.evaluate(() => Boolean(window.hostileExecuted)), false)
    assert.equal(await preview.locator('.hljs-keyword').textContent(), 'const')

    const task = preview.getByRole('checkbox', { name: 'Shared index check', exact: true })
    let releaseWrite
    const holdFirstWrite = new Promise(resolve => { releaseWrite = resolve })
    const writes = []
    const captureWrite = async route => {
      if (route.request().method() === 'PUT') {
        writes.push(route.request().postDataJSON())
        if (writes.length === 1) await holdFirstWrite
      }
      await route.continue()
    }
    await page.route('**/source', captureWrite)
    try {
      await task.check()
      await eventually(() => writes.length === 1, 'Checkbox did not autosave on click')
      assert.equal(await task.evaluate(element => element === document.activeElement), true)
      await task.uncheck()
      assert.equal(writes.length, 1, 'The second write ran before the first response')
      await button(page, 'First').click()
      await preview.getByRole('heading', { name: 'First', exact: true }).waitFor()
      releaseWrite()
      await eventually(() => writes.length === 2, 'Queued checkbox update did not run after navigating away')
      assert.equal(writes[0].content, saved.replace('- [ ]', '- [x]'))
      assert.equal(writes[1].content, saved)
      assert.notEqual(writes[0].expectedHash, writes[1].expectedHash)
      await eventually(() => readFileSync(notePath, 'utf8') === saved, 'Unchecking did not persist')
    } finally {
      releaseWrite()
      await page.unroute('**/source', captureWrite)
    }
    if (!await folder.evaluate(element => element.parentElement.open)) await folder.click()
    await page.locator('button[title="Projects/notes-regression.md"]').click()
    await preview.getByRole('heading', { name: 'Notes regression', exact: true }).waitFor()

    const blockEditor = textbox(page, 'Block Markdown')
    await preview.getByText('Editable body.', { exact: true }).click()
    assert.equal(await blockEditor.inputValue(), 'Editable body.')
    await blockEditor.fill('Discard this block edit.')
    await button(preview, 'Cancel').click()
    await preview.getByText('Editable body.', { exact: true }).waitFor()
    assert.equal(readFileSync(notePath, 'utf8'), saved)
    const editBlock = button(preview, 'Edit block at line 6')
    await editBlock.press('Enter')
    await blockEditor.fill('Updated body.\n\nSecond paragraph.')
    await page.getByRole('searchbox', { name: 'Search notes' }).click()
    await preview.getByText('Second paragraph.', { exact: true }).waitFor()
    saved = saved.replace('Editable body.', 'Updated body.\n\nSecond paragraph.')
    await eventually(() => readFileSync(notePath, 'utf8') === saved, 'Block edit changed other lines or failed to save')

    // A pristine inline editor must not reuse its old source range after a refresh.
    await preview.getByText('Updated body.', { exact: true }).click()
    await blockEditor.waitFor()
    await tab(page, 'Settings').click()
    saved = saved.replace('Second paragraph.', 'Refreshed by a Bot.')
    writeFileSync(notePath, saved)
    await tab(page, 'Notes').click()
    await preview.getByText('Refreshed by a Bot.', { exact: true }).waitFor()
    await blockEditor.waitFor({ state: 'hidden' })

    await tab(page, 'TODOs').click()
    await page.getByRole('checkbox', { name: 'Complete Shared index check', exact: true }).waitFor()
    await button(page, 'Open note: Shared index check').click()
    await noteView(page, 'Raw').click()
    await editor.waitFor()
    const draft = saved + '\nMy unsaved changes\n'
    await editor.fill(draft)
    const onDisk = saved + '\nBot wrote first\n'
    writeFileSync(notePath, onDisk)
    const response = page.waitForResponse(value => new URL(value.url()).pathname.endsWith('/source') && value.request().method() === 'PUT')
    await page.getByRole('searchbox', { name: 'Search notes' }).click()
    assert.equal((await response).status(), 409)
    await page.getByRole('alert').filter({ hasText: 'The note changed on disk' }).waitFor()
    assert.equal(await editor.inputValue(), draft, 'Conflicting save discarded the draft')
    assert.equal(readFileSync(notePath, 'utf8'), onDisk, 'Conflicting save overwrote the Bot edit')

    writeFileSync(path.join(fixture.vault, 'Projects', 'from-bot.md'), '# Added by a Bot\n')
    await page.getByRole('searchbox', { name: 'Search notes' }).fill('from-bot')
    await page.getByRole('button', { name: /Added by a Bot/ }).waitFor()
    assert.equal(automaticRescans, 0, 'The views sent an automatic full scan request')
    console.log('PASS Notes autosaves edits, serializes checkbox updates, preserves conflicts, and lays out folder rows')
  } finally {
    page.off('request', countRescan)
  }
}

async function prerequisiteRegression(browser) {
  const fixture = await startFixture('0.12.0rc6')
  const page = await browser.newPage()
  try {
    await page.goto(fixture.origin)
    await page.getByRole('button', { name: 'Open note: First', exact: true }).waitFor()
    assert.equal(await select(page, 'Move First to column').isDisabled(), true)
    await button(page, 'New ticket').click()
    await textbox(page, 'Ticket note path').fill('blocked.md')
    await textbox(page, 'Ticket title').fill('Must not write')
    assert.equal(await button(page, 'Create ticket').isDisabled(), true)
    assert.equal(await button(page, 'Rebalance…').isDisabled(), true)
    await tab(page, 'TODOs').click()
    await page.getByRole('checkbox', { name: 'Complete First TODO', exact: true }).waitFor()
    assert.equal(await page.getByRole('checkbox', { name: 'Complete First TODO', exact: true }).isDisabled(), true)
    await button(page, 'Open note: First TODO').click()
    const preview = page.getByLabel('Markdown preview')
    const noteTask = preview.getByRole('checkbox', { name: 'First TODO', exact: true })
    await noteTask.waitFor()
    assert.equal(await noteTask.isDisabled(), true)
    assert.equal(await preview.getByRole('button', { name: /Edit block/ }).count(), 0)
    await tab(page, 'Settings').click()
    await button(page, 'Preview migration').click()
    assert.equal(await button(page, 'Back up and migrate').isDisabled(), true)
    assert.equal(existsSync(path.join(fixture.vault, 'blocked.md')), false)
    console.log('PASS unfixed host remains browsable with all note writes disabled')
  } finally {
    await page.close()
    await fixture.stop()
  }
}

async function wikilinkRegression(page, fixture) {
  const sourcePath = path.join(fixture.vault, 'Projects', 'link-source.md')
  const targetPath = path.join(fixture.vault, 'Projects', 'link-target.md')
  const source = '# Link source\n\nSee [[Projects/link-target|Release checklist]].\n'
  writeFileSync(targetPath, '# Target note\n')
  writeFileSync(sourcePath, source)

  await page.goto(fixture.origin)
  await tab(page, 'Notes').click()
  await page.getByRole('searchbox', { name: 'Search notes' }).fill('link-source')
  await page.getByRole('button', { name: /Link source/ }).click()
  const editor = textbox(page, 'Note Markdown')
  assert.equal(await noteView(page, 'Raw').getAttribute('aria-checked'), 'true')
  assert.equal(await button(page, 'Full width').getAttribute('aria-pressed'), 'true')
  const updated = source + '\nSaved on view change\n'
  await editor.fill(updated)
  await noteView(page, 'Rendered').click()
  await button(page, 'Release checklist').click()
  await page.locator('code[title="Projects/link-target.md"]').waitFor()
  const backlinks = page.getByRole('region', { name: 'Backlinks' })
  await backlinks.getByRole('button', { name: /Link source/ }).click()
  await page.locator('code[title="Projects/link-source.md"]').waitFor()
  await noteView(page, 'Raw').click()
  assert.equal(await editor.inputValue(), updated)
  await eventually(() => readFileSync(sourcePath, 'utf8') === updated, 'Note did not save while navigating via wikilink')

  await noteView(page, 'Rendered').click()
  await button(page, 'Release checklist').click()
  await backlinks.getByRole('button', { name: /Link source/ }).waitFor()
  writeFileSync(sourcePath, '# Link source\n\nRemoved the reference outside Quartizo.\n')
  await backlinks.getByRole('button', { name: /Link source/ }).waitFor({ state: 'hidden' })
  console.log('PASS wikilinks and backlinks navigate to exact notes, preserve edits, and reflect external changes')
}

async function noteAppearanceRegression(page, fixture) {
  const notePath = path.join(fixture.vault, 'appearance-example.md')
  const markdown = '# Appearance example\n\n### Section details\n\nBody text.\n'
  writeFileSync(notePath, markdown)
  await page.goto(fixture.origin)
  const showNote = async () => {
    await tab(page, 'Notes').click()
    await page.getByRole('searchbox', { name: 'Search notes' }).fill('appearance-example')
    await button(page, 'Appearance example').click()
  }
  const heading = page.getByLabel('Markdown preview').getByRole('heading', { name: 'Section details' })
  const headingStyle = () => heading.evaluate(element => {
    const style = getComputedStyle(element)
    return [style.color, style.borderInlineStartWidth, style.borderBlockEndWidth, style.borderBlockEndColor]
  })
  await showNote()
  const defaults = await headingStyle()
  assert.deepEqual(defaults.slice(1, 3), ['2px', '0px'])

  await tab(page, 'Settings').click()
  const settings = page.getByRole('region', { name: 'Notes appearance' })
  await select(settings, 'Heading text color').selectOption('custom')
  await settings.getByLabel('Custom heading text color').fill('#124ca8')
  await select(settings, 'Heading lines').selectOption('all')
  await select(settings, 'Heading line color').selectOption('custom')
  await settings.getByLabel('Custom heading line color').fill('#a8235b')
  assert.equal(await settings.locator('.qz-settings-appearance-preview h3').evaluate(element => getComputedStyle(element).borderBlockEndColor), 'rgb(168, 35, 91)')
  await tab(page, 'Notes').click()
  const customized = ['rgb(18, 76, 168)', '0px', '1px', 'rgb(168, 35, 91)']
  assert.deepEqual(await headingStyle(), customized)
  await page.reload()
  await showNote()
  assert.deepEqual(await headingStyle(), customized)

  await tab(page, 'Settings').click()
  const viewport = page.viewportSize()
  try {
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(await settings.evaluate(element => element.scrollWidth <= element.clientWidth), true)
    await select(settings, 'Heading lines').selectOption('none')
    assert.equal(await select(settings, 'Heading line color').isDisabled(), true)
    await tab(page, 'Notes').click()
    assert.deepEqual((await headingStyle()).slice(1, 3), ['0px', '0px'])
    await tab(page, 'Settings').click()
    await button(settings, 'Reset defaults').click()
  } finally {
    await page.setViewportSize(viewport)
  }
  await tab(page, 'Notes').click()
  assert.deepEqual(await headingStyle(), defaults)
  assert.equal(readFileSync(notePath, 'utf8'), markdown)
  console.log('PASS heading colors and lines apply in Settings and Notes, persist on reload, and reset independently of Markdown')
}

let browser
let fixture
let page
let success = false
try {
  await build({ entryPoints: [path.join(here, 'entry.jsx')], bundle: true, outfile: bundle, format: 'esm',
    nodePaths: [path.join(ui, 'node_modules')], alias: {
      '@kirocrew/app-sdk/ui': path.join(here, 'ui.jsx'), '@kirocrew/app-sdk': path.join(here, 'sdk.jsx'),
    } })
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  fixture = await startFixture()
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  await cancelledPreviewRegression(page, fixture)
  await draftAndRequestRegression(page, fixture)
  await selfDropRegression(page, fixture)
  await exhaustionRegression(page, fixture)
  await migrationRegression(page, fixture)
  await customColumnsRegression(page, fixture)
  await notesRegression(page, fixture)
  await wikilinkRegression(page, fixture)
  await noteAppearanceRegression(page, fixture)
  await prerequisiteRegression(browser)
  assert.deepEqual(errors, [])
  success = true
  console.log('All browser regressions passed with the production bundle and real signed backend.')
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true }).catch(() => {})
  console.error(`Browser regression failed. Artifacts: ${artifacts}`)
  throw error
} finally {
  if (browser) await browser.close()
  if (fixture) await fixture.stop()
  if (success) rmSync(artifacts, { recursive: true, force: true })
}
