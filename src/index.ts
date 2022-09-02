import { execSync } from 'child_process'
import { Pool } from 'pg'

const testDbMainUrl = process.env.TEST_DB_MAIL_URL

const anonDbMainUrl = process.env.ANON_DB_MAIL_URL

function runCommand(cmd: string) {
  console.log('>> ', cmd)
  execSync(cmd, { stdio: 'inherit' })
}

function doExportImport() {
  console.log(
    'Will start a dump from the source DB and import it to the target DB',
  )
  console.log(
    'This will output a bunch of errors related to permissions on extensions, systems table, etc. and the command will say it failed, but we can ignore it. Our tables will be successfully imported.',
  )
  try {
    runCommand(
      `pg_dump --verbose --no-owner --no-privileges --format custom ${testDbMainUrl} | pg_restore --verbose --no-owner --no-privileges --clean --if-exists --dbname=${anonDbMainUrl}`,
    )
  } catch (e) {
    console.warn(e)
    console.log('We continue despite the errors from the import')
  }
  console.log('Export/import terminé')
}

const createAnonimyzeFunctionSql = `
CREATE OR REPLACE FUNCTION anonymize(
  str TEXT
)
  RETURNS TEXT 
  AS $$
        BEGIN
          IF str = '' THEN
          RETURN '';
      ELSE
        RETURN CONCAT('anon_', MD5(str));
      END IF;
        END;
  $$ 
LANGUAGE plpgsql
IMMUTABLE
RETURNS NULL ON NULL INPUT 
    `

const pool = new Pool({
  connectionString: anonDbMainUrl,
})

async function runSql(pool: Pool, sql: string): Promise<void> {
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

const fieldsToAnonymizeByTable: { [table: string]: string[] } = {
  access_tokens: ['emailed_to'],
  auth_attempts: ['login'],
  companies: ['siret', 'name', 'street', 'address_supplement'],
  emails_validation: ['email'],
  report_consumer_review: ['details'],
  report_files: ['filename', 'storage_filename', 'av_output'],
  reports: [
    'company_name',
    'first_name',
    'last_name',
    'email',
    'company_siret',
    'website_url',
    'phone',
    'company_street_number',
    'company_street',
    'company_address_supplement',
    'host',
    'consumer_phone',
    'consumer_reference_number',
  ],
  // TODO a reactiver : existe en prod uniquement
  // reports_old: [
  //   'place',
  //   'place_address',
  //   'description',
  //   'firstname',
  //   'lastname',
  //   'email',
  // ],
  // TODO pareil : existe en prod uniquement
  // sendinblue: ['subject', 'destination', 'mid'],
  subscriptions: ['email'],
  users: ['firstname', 'lastname', 'email'],
  websites: ['host'],

  // jsons à gérer
  // events -> details
  // reports -> details
}

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
  // doExportImport()

  const pool = new Pool({
    connectionString: anonDbMainUrl,
  })
  await runSql(pool, createAnonimyzeFunctionSql)

  const queries = Object.entries(fieldsToAnonymizeByTable).map(
    ([table, fields]) => generateSqlAnonymizeFieldsInTable(table, fields),
  )

  await queries.reduce(async (acc, current) => {
    await acc
    return runSql(pool, current)
  }, Promise.resolve())

  pool.end()
}

start()
