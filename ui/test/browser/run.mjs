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
  const card = page.locator('li').filter({ has: button(page, 'Open Kiro Notes: Second') })
  await card.dragTo(card, { sourcePosition: { x: 25, y: 15 }, targetPosition: { x: 110, y: 45 } })
  await delay(500)
  assert.equal(moves, 0, 'Self-drop sent a mutation')
  assert.deepEqual(readFileSync(path.join(fixture.vault, 'second.md')), before)
  assert.equal(await page.getByRole('region', { name: 'Ready', exact: true }).getByRole('button', { name: /Open Kiro Notes:/ }).first().getAttribute('aria-label'), 'Open Kiro Notes: First')
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

async function prerequisiteRegression(browser) {
  const fixture = await startFixture('0.12.0rc6')
  const page = await browser.newPage()
  try {
    await page.goto(fixture.origin)
    await page.getByRole('button', { name: 'Open Kiro Notes: First', exact: true }).waitFor()
    assert.equal(await select(page, 'Move First to column').isDisabled(), true)
    await button(page, 'New ticket').click()
    await textbox(page, 'Ticket note path').fill('blocked.md')
    await textbox(page, 'Ticket title').fill('Must not write')
    assert.equal(await button(page, 'Create ticket').isDisabled(), true)
    assert.equal(await button(page, 'Rebalance…').isDisabled(), true)
    await tab(page, 'TODOs').click()
    await page.getByRole('checkbox', { name: 'Complete First TODO', exact: true }).waitFor()
    assert.equal(await page.getByRole('checkbox', { name: 'Complete First TODO', exact: true }).isDisabled(), true)
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
