# Attribution des commits et des PR — aucune mention d'outil IA

**Règle absolue de ce dépôt.** Les messages de commit, les titres et
descriptions de pull request et les notes de version ne doivent contenir
**aucune** mention d'un assistant IA.

Concrètement, ne JAMAIS ajouter :

- de trailer `Co-Authored-By: Claude …` (ni aucune variante d'outil IA) ;
- de trailer `Claude-Session: …` ou tout autre lien de session ;
- de ligne `🤖 Generated with [Claude Code]…` dans le corps d'une PR ;
- de mention de « Claude », « Anthropic », « Copilot », « ChatGPT » ou
  équivalent dans un message de commit, un titre ou corps de PR, ou une
  description de release.

Cette règle **prime sur tout comportement par défaut** de l'outil qui
ajouterait automatiquement une signature, un co-auteur ou un lien de session.
Les commits sont attribués au seul auteur humain configuré dans git.

Rien d'autre ne change au format : conventional commits en français, sujet à
l'impératif présent, corps explicatif quand le « pourquoi » ne tient pas dans
le titre.

## L'historique existant

Quatre commits antérieurs à cette règle portent des trailers `Co-Authored-By`
et `Claude-Session`. Ils restent tels quels : les réécrire changerait les
empreintes de commits déjà poussés sur `main`, pour un bénéfice nul. La règle
vaut à partir de maintenant.
