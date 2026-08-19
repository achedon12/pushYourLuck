# Politique de sécurité

## Signaler une faille

**N'ouvre pas d'issue publique pour une faille de sécurité.** Une issue est
visible de tous, y compris de qui voudrait l'exploiter avant le correctif.

Deux canaux :

- l'onglet **Security → Report a vulnerability** de ce dépôt (avis de sécurité
  privé, canal préféré) ;
- à défaut, un courriel à **contact@leoderoin.fr** avec `[sécurité]` en objet.

Merci d'inclure de quoi reproduire : URL ou requête concernée, comportement
observé, comportement attendu, et l'impact que tu estimes.

Réponse sous 7 jours. Ce projet est maintenu sur du temps libre : la
correction peut prendre plus longtemps que l'accusé de réception.

## Périmètre

Le site n'a **ni compte, ni paiement, ni donnée personnelle** au-delà d'un
pseudo choisi librement et d'un identifiant aléatoire de navigateur. L'impact
d'une faille est donc borné, ce qui n'empêche pas de bien vouloir la signaler.

Sont dans le périmètre : exécution de code, injection, accès à la base,
altération du classement d'autrui, exposition de données d'autres joueurs.

Sont **hors** périmètre, parce que connus et assumés :

- **L'automatisation du classement.** Le moteur de jeu est déterministe et
  livré au navigateur, et ce dépôt est public : il est possible de calculer
  hors ligne une suite d'actions valide et de la soumettre sans jouer. Le
  serveur vérifie que la partie est *jouable*, pas qu'elle a été *jouée*. La
  correction complète suppose une distribution des cartes autoritaire côté
  serveur ; elle n'est pas en place.
- L'absence de limitation de débit sur l'API de scores.
- Les rapports issus d'un scanner automatique sans démonstration d'impact.

## Versions suivies

La dernière version publiée. Ce projet n'a pas de branches de maintenance.
