# StatsRefill

## But

Alimenter une DB "stats", toutes les nuits.

- Cette DB est une copie extrêmement simplifiée de la DB de prod
- Cette DB est anonymisée (le seul champ sensible, company_name, est hashé)
- Cette DB sert pour le metabase des stats publiques (https://signal.conso.gouv.fr/fr/stats)

## Fonctionnement

Toutes les nuits :

- Dans la DB "stats", on drop/recreate quelques tables (reports, companies, events, ...).
  - On les crée avec juste quelques colonnes essentielles, que celles qui nous intéressent.
- Pour chacun de ces tables, on query les lignes depuis la DB main de prod, puis on les insert dans la table équivalente dans la DB "stats"
  - On fait la query puis insertion par batchs de 1000 lignes
  - le champ company_name est anonymisée (il est utilisé dans une requête du Metabase)

Ce process peut-être déclenché ponctuellement en tapant sur l'endpoint `/launch` :

        curl -X POST https://.......:8080/launch -H "Authorization: Bearer XXXXXXX"

## Env variables

- SOURCE_DB_MAIN_URL url JDBC de la db anon (mettre ici l'utilisateur read only, plus safe !!)
- STATS_DB_URL url JDBC de la db des stats /!\ attention c'est celle qu'on va écraser !
- API_KEY
- CC_NODE_BUILD_TOOL=yarn2 pour Clever Cloud
- NODE_ENV=production à mettre en prod
