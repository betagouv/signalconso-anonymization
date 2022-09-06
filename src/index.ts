import { anonymizationFunctionsSql } from './anonymizationRules'
import { doExportImport, generateAnonymizationSqlForAllTables } from './core'
import { createPool, readFromEnv, runSqlsSequentially } from './utils'

// Notes et caveats
//
// - le dump/restore crache plein d'erreurs liées aux permissions/users.
// C'est compliqué de comprendre pourquoi, j'ai choisi de juste les ignorer.
// Les tables et leurs contenus sont bien importés
//
// - le dump/restore n'efface pas la db anon existante. Il écrase juste les tables existant déjà
// Si quelqu'un crée une table, ou une fonction, etc. sur la db anon, elle restera là
// On pourrait essayer de faire un vrai si besoin.
//
// - la fonction d'anonymisation fait juste un hash MD5 de certains champs

const sourceDbUrl = readFromEnv('SOURCE_DB_MAIN_URL')
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

async function start() {
  checkWorkingOnAnonDb()
  doExportImport({ sourceDbUrl, anonDbUrl })
  const pool = createPool(anonDbUrl)
  await runSqlsSequentially(pool, anonymizationFunctionsSql)
  await runSqlsSequentially(pool, generateAnonymizationSqlForAllTables())
  pool.end()
}

start()
