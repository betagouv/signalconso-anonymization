import 'dotenv/config'
import express, { Request, Response } from 'express'
import cron from 'node-cron'
import { checkWorkingOnAnonDb, conf } from './conf'
import { recreateAnonDb } from './core'

async function startServer() {
  const app = express()
  app.get('/', (_, res: Response) => {
    res.json({ message: 'Hello anonymization app' })
  })
  app.post('/launch', async (req: Request, res: Response) => {
    const authorizationHeader = req.headers.authorization ?? ''
    if (authorizationHeader === `Bearer ${conf.apiKey}`) {
      res.json({ message: 'Recreation of anon DB launched in the background' })
      recreateAnonDb()
    } else {
      res.status(401).json({ message: 'Missing or incorrect authentication' })
    }
  })
  app.listen(conf.port, () => {
    console.log(`Anonymization app is running on port ${conf.port}`)
  })
}

async function start() {
  console.log('~~ Starting anonymization app ~~')
  checkWorkingOnAnonDb()

  console.log('Scheduling cron with pattern', conf.cronPattern)
  cron.schedule(conf.cronPattern, () => {
    console.log('Launching scheduled task')
    recreateAnonDb()
  })

  startServer()
}

start()
