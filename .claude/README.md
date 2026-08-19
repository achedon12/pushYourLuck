# `.claude/` — configuration du projet pour Claude Code

Ce dossier porte les consignes, skills et agents propres au dépôt.

## Organisation

- **`rules/`** — les consignes, découpées par thème et importées par
  `CLAUDE.md` à la racine. Chaque fichier est autonome, pour qu'un sous-agent
  ou un `/compact` n'en charge que ce dont il a besoin.
- **`skills/`** — procédures déclenchées par ce que demande l'utilisateur.
  Chaque sous-dossier a un `SKILL.md` avec son frontmatter (`name`,
  `description`).
- **`agents/`** — sous-agents spécialisés, invoqués via
  `Agent(subagent_type: "<nom>")`. Les deux fournis sont des **reviewers** :
  ils lisent et rendent un verdict, ils ne modifient rien.
- **`settings.json`** — pré-approuve les commandes sûres et **bloque** celles
  qui détruisent des données. Tout ce qui n'est pas listé demande confirmation.

## Les règles

| Fichier | Contenu |
|---|---|
| `01-architecture.md` | où vit quoi, et **l'invariant de déterminisme du moteur** |
| `02-i18n.md` | deux langues, aucune chaîne en dur |
| `03-design.md` | thèmes, palette, tests visuels |
| `04-balance.md` | équilibrage par simulation |
| `05-conventions.md` | langue, icônes, logos, commits |
| `06-tests.md` | les trois couches — une fonctionnalité = un test |
| `07-migrations.md` | une migration par livraison, jamais de `db push` |
| `08-api-security.md` | rejeu, garde d'origine, quota |
| `09-ops.md` | cron, sauvegardes, image, construction vs exécution |
| `10-gotchas.md` | pièges qui ont déjà coûté du temps |
| `11-comments.md` | le pourquoi, jamais le quoi |

## Les skills

| Skill | Se déclenche sur |
|---|---|
| `pipeline` | commande `/pipeline <tâche>` — cycle complet : analyse → implémentation → tests destructifs → PR → review → boucle de correction. Modèles sous `pipeline/templates/`. |
| `pyl-engine-change` | toute modification du moteur ou du composant qui enregistre les actions |
| `pyl-api-route` | création, modification ou sécurisation d'une route `src/app/api/` |
| `pyl-i18n-copy` | ajout ou modification de copie visible, ajout de page |
| `pyl-prisma-migration` | changement de schéma de base |
| `pyl-balance` | réglage des valeurs de jeu, « telle stratégie domine » |
| `pyl-deploy` | déploiement, Dockerfile/compose, « ça marche en local mais pas en prod » |

## Les agents

| Agent | Rôle |
|---|---|
| `pyl-determinism-reviewer` | vérifie qu'aucune impureté n'est entrée dans le moteur et que l'UI n'enregistre pas d'action sans effet. Verdict VALIDÉ / REJETÉ. |
| `pyl-i18n-reviewer` | vérifie qu'aucune chaîne visible n'est en dur et que les deux dictionnaires restent synchrones. Verdict VALIDÉ / REJETÉ. |

Les skills et agents supposent le contexte des règles : ils entrent dans le
détail procédural sans le réexpliquer.
