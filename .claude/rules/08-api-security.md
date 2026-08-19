# API des scores — trois défenses qui ne se remplacent pas

Elles couvrent trois menaces distinctes. Retirer l'une en pensant qu'une autre
la couvre est une erreur : aucune ne fait le travail des deux autres.

## 1. Le score n'est jamais lu depuis la requête

Le serveur **rejoue** la suite d'actions envoyée, depuis la graine du jour, et
recalcule le résultat (`replay.ts`). Le champ `score` d'un corps de requête est
purement ignoré : annoncer `"score": 999999` ne donne rien.

C'est la seule défense contre une partie forgée, et elle repose entièrement sur
le déterminisme du moteur (`01-architecture.md`). La raison précise d'un rejet
n'est **pas** renvoyée au client — elle indiquerait à qui fabrique une partie
où sa suite d'actions a cloché.

## 2. Origine vérifiée sur les écritures

`src/lib/origin.ts` — un POST sans en-tête `Origin`, ou venant d'un autre
domaine, repart en **403 `forbidden_origin`**, avant la lecture du corps et
sans consommer le quota d'un tiers.

**Ce que ça protège** : un autre site qui ferait poster ton visiteur à son insu
depuis son navigateur. `Origin` est posé par le navigateur lui-même et une page
ne peut pas le falsifier — c'est la protection CSRF du projet, qui n'a aucun
jeton.

**Ce que ça NE protège PAS** : un appel fabriqué hors navigateur.
`curl -H "Origin: https://pushyourluck.net"` passe sans effort. Aucune
vérification d'origine ne peut faire mieux ; ne la présente jamais comme une
restriction « au site seulement ».

Conséquence pratique : tout client non-navigateur doit poser l'en-tête. C'est
le cas de `scripts/smoke-scores.ts` et des tests, via `SITE_ORIGIN`
(`tests/fixtures.ts`).

Le `GET` du classement reste **public**, délibérément : il est affiché sur le
site, le fermer ne protégerait rien.

## 3. Quota par appelant

`src/lib/rateLimit.ts` — 20 envois par quart d'heure. C'est la seule chose qui
borne un robot jouant de **vraies** parties : le moteur est déterministe et le
dépôt est public, donc un score optimal est calculable par force brute. Aucune
validation ne peut distinguer cette partie-là d'une partie humaine.

**L'appelant est identifié par `x-real-ip`**, que nginx pose depuis l'adresse
de connexion et que l'appelant ne peut pas imposer. À défaut, par la
**DERNIÈRE** valeur de `x-forwarded-for` — jamais la première.

Ce détail a été un vrai trou : la directive nginx habituelle
(`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`) **ajoute**
l'adresse réelle à la fin d'une liste que le client a pu commencer. Lire la
première valeur donnait donc une clé neuve à chaque envoi — 25 requêtes
d'affilée passaient sans un seul 429. `rateLimit.test.ts` garde le cas.

## Format des réponses

L'API renvoie des **codes** d'erreur, jamais des phrases : le message est
traduit côté client. Un nouveau code se déclare dans les **deux** dictionnaires
(`src/i18n/fr.ts` et `en.ts`, section `errors`), sinon la compilation échoue.

| Code | Statut |
|---|---|
| `forbidden_origin` | 403 |
| `too_many_requests` | 429 (+ `Retry-After`) |
| `payload_too_large` | 413 |
| `invalid_body` / `invalid_mode` / `invalid_name` / `invalid_client` / `invalid_seed` | 400 |
| `blocked_name` / `replay_rejected` | 422 |

## Tester une route

Les deux couches sont nécessaires et ne disent pas la même chose : l'unitaire
(`src/app/api/.../route.test.ts`, Prisma simulé) éprouve la validation ; le
fonctionnel (`tests/functional/security.spec.ts`) seul dit si le garde est
réellement **branché** sur la route. Un helper juste qu'on oublie d'appeler
laisse l'API grande ouverte sans qu'aucun test unitaire ne bronche.
