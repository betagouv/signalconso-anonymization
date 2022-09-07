import express, { Request, Response } from 'express'
import { doExportImportAndAnonymization } from './core'
import { readFromEnv, readIntFromEnv } from './utils'
import cron from 'node-cron'

const sourceDbUrl = readFromEnv('SOURCE_DB_MAIN_URL')
const anonDbUrl = readFromEnv('ANON_DB_MAIN_URL')
const apiKey = readFromEnv('API_KEY')
const port = 8080
const cronPattern = '0 5 * * *' // Every night at 5AM

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
      res.json({ message: 'Import/export launched in the background' })
      doExportImportAndAnonymization({ sourceDbUrl, anonDbUrl })
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

  console.log('Scheduling cron with pattern', cronPattern)
  cron.schedule(cronPattern, () => {
    console.log('Launching scheduled task')
    doExportImportAndAnonymization({ sourceDbUrl, anonDbUrl })
  })

  startServer()
}

start()
