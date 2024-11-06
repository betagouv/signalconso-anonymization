export const conf = {
  sourceDbUrl: readFromEnv('SOURCE_DB_MAIN_URL'),
  anonDbUrl: readFromEnv('ANON_DB_MAIN_URL'),
  apiKey: readFromEnv('API_KEY'),
  port: 8080,
  cronPattern: '0 5 * * *', // Every night at 5AM
  batchSize: 1000,
}

// This is only a tiny part of the name, it should be safe to commit
const partOfAnonDbName = 'bs474'

export function checkWorkingOnAnonDb() {
  // an accidental misconfiguration could easily happen and rewrite the wrong database
  if (!conf.anonDbUrl.includes(partOfAnonDbName)) {
    throw new Error(
      "The provided anon db URL (the one we will overwrite) doesn't look like the one we expect. Be careful, you could overwrite a production database !",
    )
  }
}

function readFromEnv(envVariableName: string): string {
  const value = process.env[envVariableName]
  if (!value) {
    throw new Error(`missing or empty env variable ${envVariableName}`)
  }
  return value
}
