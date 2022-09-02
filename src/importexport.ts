import { runCommand } from './utils'

export function doExportImport({
  sourceDbUrl,
  anonDbUrl,
}: {
  sourceDbUrl: string
  anonDbUrl: string
}) {
  // TODO ici rajouter test pour verifiquer qu'on écrit pas sur la DB de prod
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
