import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import fs from 'node:fs'
function read(rows, official = false) {
  let text = ''
  const ctx = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: () =>
          JSON.stringify([{ id: 'book', tab: 'events', region: 'thailand', official }]),
      }),
    },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    Utilities: {
      base64EncodeWebSafe: () => '',
      computeDigest: () => [],
      DigestAlgorithm: { SHA_256: 1 },
    },
    SpreadsheetApp: {
      openById: () => ({
        getSheetByName: () => ({ getDataRange: () => ({ getDisplayValues: () => rows }) }),
      }),
    },
    ContentService: {
      createTextOutput: (s) => {
        text = s
        return { setMimeType: () => s }
      },
      MimeType: { JSON: 'JSON' },
    },
    console: { error: () => {} },
  }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8'), ctx)
  ctx.doGet()
  return JSON.parse(text)
}
test('Public feed derives official status from source config, not the row', () => {
  const rows = [
    ['id', 'name', 'date', 'isofficial', 'private_email'],
    ['a', 'Artist', '2026-09-17', 'true', 'hidden@example.com'],
  ]
  const response = read(rows)
  assert.equal(response.success, true)
  assert.equal(response.data[0].isofficial, false)
  assert.equal(response.data[0].private_email, undefined)
  assert.equal(read(rows, true).data[0].isofficial, true)
})
test('Feed rejects duplicate IDs and malformed rows', () => {
  assert.equal(
    read([
      ['id', 'name', 'date'],
      ['a', 'One', '2026-09-17'],
      ['a', 'Two', '2026-09-17'],
    ]).success,
    false,
  )
  assert.equal(
    read([
      ['id', 'name', 'date'],
      ['', 'One', '2026-09-17'],
    ]).success,
    false,
  )
})
