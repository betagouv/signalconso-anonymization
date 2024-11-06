import { Kysely } from 'kysely'
import { conf } from './conf'
import { anonDbResetSqls, Schema } from './schema'
import { md5, startConnectionPool } from './utils'

export async function recreateAnonDb() {
  const source = startConnectionPool('source_db')
  const anon = startConnectionPool('anon_db')
  await resetAnonDb({ anon })
  await processReports({ source, anon })
  await processCompanyAccesses({ source, anon })
  await processCompanies({ source, anon })
  await processEvents({ source, anon })
  source.destroy()
  anon.destroy()
}

async function resetAnonDb({ anon }: { anon: Kysely<Schema> }) {
  for (const sqlQuery of anonDbResetSqls) {
    await sqlQuery.execute(anon)
  }
}

async function processReports({
  source,
  anon,
}: {
  source: Kysely<Schema>
  anon: Kysely<Schema>
}) {
  const table = 'reports'
  await copyTableByBatches(table, {
    query: (offset, limit) =>
      source
        .selectFrom(table)
        .select([
          'id',
          'creation_date',
          'status',
          'category',
          'tags',
          'company_id',
          'company_name',
        ])
        .orderBy('id')
        .offset(offset)
        .limit(limit)
        .execute(),
    transform: (row) => ({
      ...row,
      company_name: row.company_name
        ? `anon_${md5(row.company_name)}`
        : undefined,
    }),
    insert: (rows) => anon.insertInto(table).values(rows).execute(),
  })
}

async function processCompanyAccesses({
  source,
  anon,
}: {
  source: Kysely<Schema>
  anon: Kysely<Schema>
}) {
  const table = 'company_accesses'
  await copyTableByBatches(table, {
    query: (offset, limit) =>
      source
        .selectFrom(table)
        .select(['company_id', 'user_id'])
        .orderBy(['company_id', 'user_id'])
        .offset(offset)
        .limit(limit)
        .execute(),
    transform: (r) => r,
    insert: (rows) => anon.insertInto(table).values(rows).execute(),
  })
}

async function processCompanies({
  source,
  anon,
}: {
  source: Kysely<Schema>
  anon: Kysely<Schema>
}) {
  const table = 'companies'
  await copyTableByBatches(table, {
    query: (offset, limit) =>
      source
        .selectFrom(table)
        .select(['company_id', 'department'])
        .orderBy('company_id')
        .offset(offset)
        .limit(limit)
        .execute(),
    transform: (r) => r,
    insert: (rows) => anon.insertInto(table).values(rows).execute(),
  })
}

async function processEvents({
  source,
  anon,
}: {
  source: Kysely<Schema>
  anon: Kysely<Schema>
}) {
  const table = 'events'
  await copyTableByBatches(table, {
    query: (offset, limit) =>
      source
        .selectFrom(table)
        .select(['id', 'creation_date', 'report_id', 'action'])
        // no need for all the other events
        .where('action', '=', 'Réponse du professionnel au signalement')
        .orderBy('id')
        .offset(offset)
        .limit(limit)
        .execute(),
    transform: (r) => r,
    insert: (rows) => anon.insertInto(table).values(rows).execute(),
  })
}

async function copyTableByBatches<RowRead, RowToInsert>(
  table: string,
  {
    query,
    transform,
    insert,
  }: {
    query: (offset: number, limit: number) => Promise<RowRead[]>
    transform: (r: RowRead) => RowToInsert
    insert: (rows: RowToInsert[]) => Promise<unknown>
  },
) {
  let offset = 0
  while (true) {
    // select a batch of rows from the source db
    const rows = await query(offset, conf.batchSize)
    if (rows.length === 0) {
      console.log(`Done with table ${table}`)
      break
    } else {
      console.log(`Processing ${rows.length} rows of table ${table}`)
      // transform each row, if needed
      const rowsTransformed = rows.map(transform)
      // insert into the target db
      await insert(rowsTransformed)
      offset += conf.batchSize
    }
  }
}
