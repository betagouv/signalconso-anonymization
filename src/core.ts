import {
  anonymizationFunctionsSql,
  FieldDefinition,
  fieldsToAnonymizeByTable,
} from './anonymizationRules'
import { createPool, runCommand, runSqlsSequentially } from './utils'

export async function doExportImportAndAnonymization({
  sourceDbUrl,
  anonDbUrl,
}: {
  sourceDbUrl: string
  anonDbUrl: string
}) {
  doExportImport({ sourceDbUrl, anonDbUrl })
  const pool = createPool(anonDbUrl)
  await runSqlsSequentially(pool, anonymizationFunctionsSql)
  await runSqlsSequentially(pool, generateAnonymizationSqlForAllTables())
  pool.end()
}

function doExportImport({
  sourceDbUrl,
  anonDbUrl,
}: {
  sourceDbUrl: string
  anonDbUrl: string
}) {
  console.log(
    'Will start a dump from the source DB and import it to the target DB',
  )
  console.log(
    'This will output a bunch of errors related to permissions on extensions, systems table, etc. and the command will say it failed, but we can ignore it. Our tables will be successfully imported.',
  )
  try {
    runCommand(
      `pg_dump --verbose --no-owner --no-privileges --format custom ${sourceDbUrl} | pg_restore --verbose --no-owner --no-privileges --clean --if-exists --dbname=${anonDbUrl}`,
    )
  } catch (e) {
    console.warn(e)
    console.log('We continue despite the errors from the import')
  }
  console.log('Export/import terminé')
}

function generateAnonymizationSqlForAllTables(): string[] {
  return Object.entries(fieldsToAnonymizeByTable).map(([table, fields]) =>
    generateSqlAnonymizeFieldsInTable(table, fields),
  )
}

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
