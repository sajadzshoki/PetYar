import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../../server/db/migrations')

test('migration journal is ordered and includes 0010', () => {
  const journal = JSON.parse(readFileSync(join(dir, 'meta/_journal.json'), 'utf8')) as {
    entries: { idx: number, tag: string }[]
  }
  const tags = journal.entries.map(e => e.tag)
  assert.deepEqual(journal.entries.map(e => e.idx), [...Array(journal.entries.length).keys()])
  assert.ok(tags.includes('0010_phase12_audit'))
  assert.ok(tags.includes('0009_phase11_admin'))
  const sqlFiles = readdirSync(dir).filter(name => name.endsWith('.sql')).sort()
  for (const entry of journal.entries) {
    assert.ok(sqlFiles.includes(`${entry.tag}.sql`), `missing ${entry.tag}.sql`)
  }
})

test('0010 adds unique open disputes index', () => {
  const sql = readFileSync(join(dir, '0010_phase12_audit.sql'), 'utf8')
  assert.match(sql, /disputes_open_booking_idx/)
  assert.match(sql, /OPEN/)
})
