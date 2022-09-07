import express, { Request, Response } from 'express'
import { doExportImportAndAnonymization } from './core'
import { readFromEnv, readIntFromEnv } from './utils'

/*
Notes et caveats

- le dump ne marchera pas si vous utilisez un utilisateur readonly sur la DB source (bien qu'on ne fasse que lire).
Utilisez la connection string donnée par Clever Cloud

- le dump/restore crache plein d'erreurs liées aux permissions/users.
C'est compliqué de comprendre pourquoi, j'ai choisi de juste les ignorer.
Les tables et leurs contenus sont bien importés

- le dump/restore n'efface pas la db anon existante. Il écrase juste les tables existant déjà
Si quelqu'un crée une table, ou une fonction, etc. sur la db anon, elle restera là
On pourrait essayer de faire un vrai reset du schema si besoin.

- la fonction d'anonymisation fait juste un hash MD5 de certains champs choisis.
Pour certains champs JSON ou tableau de strings, elle fait cet hash sur chacun des champs

*/

const sourceDbUrl = readFromEnv('SOURCE_DB_MAIN_URL')
const anonDbUrl = readFromEnv('ANON_DB_MAIN_URL')
const port = readIntFromEnv('PORT')
const apiKey = readFromEnv('API_KEY')

// This is only a tiny part of the name, it should be safe to commit
const partOfAnonDbName = 'bs474'

function checkWorkingOnAnonDb() {
  // an accidental misconfiguration could easily happen and rewrite the wrong database
  if (!anonDbUrl.includes(partOfAnonDbName)) {
    throw new Error(
      "The provided anon db URL (the one we will overwrite) doesn't look like the one we expect. Be careful, you could overwrite a production database !",
    )
  }
}

async function startServer() {
  const app = express()

  app.get('/', (_, res: Response) => {
    res.json({ message: 'Hello anonymization app' })
  })

  app.post('/launch', async (req: Request, res: Response) => {
    const authorizationHeader = req.headers.authorization ?? ''
    if (authorizationHeader === `Bearer ${apiKey}`) {
      await doExportImportAndAnonymization({ sourceDbUrl, anonDbUrl })
      res.json({ message: 'Import/export and anonymization done' })
    } else {
      res.status(401).json({ message: 'Missing or incorrect authentication' })
    }
  })

  app.listen(port, () => {
    console.log(`Anonymization app is running on port ${port}`)
  })
}

async function start() {
  console.log('Starting anonymization app')
  checkWorkingOnAnonDb()
  startServer()
}

start()
