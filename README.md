# anonymization

TODO updater readme

    curl -X POST http://localhost:8080/launch -H "Authorization: Bearer toto"

## Fonctionnement

Toutes les nuits :

- On fait un dump de la DB de prod et on l'import dans la db "anon"
- Puis on fait une anonymization (juste un hash MD5) de plein de champs sensibles

Ce process peut-être déclenché ponctuellement en tapant sur l'endpoint /launch

## Caveats

/!\ le dump/restore crache plein d'erreurs liées aux permissions/users.
C'est compliqué de comprendre pourquoi, j'ai choisi de juste les ignorer.
Les tables et leurs contenus sont bien importés

/!\ le dump/restore n'efface pas la db anon existante. Il écrase juste les tables existant déjà
Si quelqu'un crée une table, ou une fonction, etc. sur la db anon, elle restera là
On pourrait essayer de faire un vrai reset du schema si besoin.

## Env variables

- SOURCE_DB_MAIN_URL url JDBC de la db de prod. /!\ le dump ne marchera pas si vous utilisez un utilisateur readonly sur la DB source (bien qu'on ne fasse que lire)
- STATS_DB_URL url JDBC de la db anon /!\ attention c'est celle qu'on va écraser !
- API_KEY
- CC_NODE_BUILD_TOOL=yarn2 pour Clever Cloud
- NODE_ENV=production à mettre en prod
