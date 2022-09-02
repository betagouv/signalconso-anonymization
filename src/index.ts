import {
  createAnonymizeFunctionsSql,
  FieldDefinition,
  fieldsToAnonymizeByTable,
} from './anonymizationRules'
import { doExportImport } from './importexport'
import { createPool, readFromEnv, runSqlsSequentially } from './utils'

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

function generateSqlAnonymizeFieldsInTable(
  table: string,
  fields: FieldDefinition[],
) {
  if (fields.length) {
    const fieldsUpdate = fields
      .map((f) => {
        const fieldName = typeof f === 'string' ? f : f.name
        const functionName =
          typeof f === 'string'
            ? 'anonymize'
            : f.type === 'array_of_string'
            ? 'anonymize_array'
            : 'anonymize_json_obj'

        return `${fieldName} = ${functionName}(${fieldName})`
      })
      .join(',\n')
    return `
    UPDATE ${table}
    SET ${fieldsUpdate}
    `
  }
  return 'SELECT 1'
}

async function start() {
  checkWorkingOnAnonDb()
  // doExportImport({ sourceDbUrl, anonDbUrl })
  const pool = createPool(anonDbUrl)
  await runSqlsSequentially(pool, createAnonymizeFunctionsSql)
  const anonymizationQueries = Object.entries(fieldsToAnonymizeByTable).map(
    ([table, fields]) => generateSqlAnonymizeFieldsInTable(table, fields),
  )
  await runSqlsSequentially(pool, anonymizationQueries)
  pool.end()
}

start()
