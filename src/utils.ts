import { execSync } from 'child_process'
import { Pool } from 'pg'

export function runCommand(cmd: string) {
  console.log('>> ', cmd)
  execSync(cmd, { stdio: 'inherit' })
}

export function createPool(connectionString: string) {
  return new Pool({
    connectionString,
  })
}

export async function runSql(pool: Pool, sql: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log('>> Running SQL:', sql)
    pool.query(sql, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

export async function runSqlsSequentially(pool: Pool, queries: string[]) {
  return await queries.reduce(async (acc, current) => {
    await acc
    return runSql(pool, current)
  }, Promise.resolve())
}

export function readFromEnv(envVariableName: string): string {
  const value = process.env[envVariableName]
  if (!value) {
    throw new Error(`missing or empty env variable ${envVariableName}`)
  }
  return value
}
