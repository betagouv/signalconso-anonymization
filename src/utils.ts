import { createHash } from 'crypto'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { conf } from './conf'
import { Schema } from './schema'

export function startConnectionPool(target: 'source_db' | 'stats_db') {
  // same Schema is shared for both DBs
  const db = new Kysely<Schema>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString:
          target === 'source_db' ? conf.sourceDbUrl : conf.statsDbUrl,
        max: 1,
      }),
    }),
  })
  return db
}

export function md5(s: string) {
  return createHash('md5').update(s).digest('hex')
}
