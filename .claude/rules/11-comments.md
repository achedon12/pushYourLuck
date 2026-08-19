# Commentaires — le pourquoi, jamais le quoi

**Un commentaire qui paraphrase le code qu'il surplombe est un déchet et doit
être supprimé.** Le nom d'une fonction, d'une constante ou d'un modèle dit déjà
ce que la chose *est*. Le commentaire ne se justifie que s'il porte une
information qu'on ne peut PAS déduire en lisant le code.

Le test avant d'écrire ou de garder un commentaire : **« un développeur
compétent qui lit ce code peut-il retrouver cette information tout seul ? »**
Si oui, supprime. Ce n'est pas un arbitrage de goût : un commentaire redondant
finit toujours par mentir quand le code évolue sans lui.

## À supprimer

- La paraphrase de l'identifiant : `/** Nombre de manches. */` au-dessus de
  `rounds`.
- Les `@param` / `@returns` qui redisent le nom et le type évident du
  paramètre. Garde la ligne seulement quand elle ajoute une **unité**, une
  **contrainte** ou un **piège**.
- La narration : `// on récupère le joueur` au-dessus de `getPlayer()`.

## À garder, et à écrire

- **La raison d'un choix contre-intuitif.** « `dayKey` est figé à Europe/Paris,
  sinon le classement n'a pas de sens d'un fuseau à l'autre. »
- **Le contrat entre deux fichiers** qu'aucun des deux ne rend visible seul.
  « Le rejeu refuse toute action sans effet : l'UI ne doit jamais en
  enregistrer une. »
- **Ce qui a déjà cassé.** « Le deux-points après l'adresse est obligatoire :
  `127.0.0.1${PORT}` produit `127.0.0.13001`, que Docker rejette. » Ce genre de
  ligne vaut une heure de débogage à qui la lit.
- **Ce qu'on a essayé et écarté**, avec la raison. Sans ça, le prochain
  refera la tentative.

Les commentaires sont en **français**, comme la copie utilisateur.
