import {
  createAnonymizeFunctionSql,
  fieldsToAnonymizeByTable,
} from './anonymizationRules'
import { doExportImport } from './importexport'
import { createPool, readFromEnv, runSql, runSqlsSequentially } from './utils'

const sourceDbUrl = readFromEnv('TEST_DB_MAIN_URL')
const anonDbUrl = readFromEnv('ANON_DB_MAIN_URL')

// This is only a tiny part of the name, it should be safe to commit
const partOfAnonDbName = 'byk8h'

function checkWorkingOnAnonDb() {
  // an accidental misconfiguration could easily happen and rewrite the wrong database
  if (!anonDbUrl.includes(partOfAnonDbName)) {
    throw new Error(
      "The provided anon db URL (the one we will overwrite) doesn't look like the one we expect. Be careful, you could overwrite a production database !",
    )
  }
}

const pool = createPool(anonDbUrl)

function generateSqlAnonymizeFieldsInTable(table: string, fields: string[]) {
  if (fields.length) {
    const fieldsUpdate = fields.map((f) => `${f} = anonymize(${f})`).join(',\n')
    return `
    UPDATE ${table}
    SET ${fieldsUpdate}
    `
  }
  return 'SELECT 1'
}

async function start() {
  checkWorkingOnAnonDb()
  doExportImport({ sourceDbUrl, anonDbUrl })
  const pool = createPool(anonDbUrl)
  await runSql(pool, createAnonymizeFunctionSql)
  const anonymizationQueries = Object.entries(fieldsToAnonymizeByTable).map(
    ([table, fields]) => generateSqlAnonymizeFieldsInTable(table, fields),
  )
  await runSqlsSequentially(pool, anonymizationQueries)
  pool.end()
}

start()
