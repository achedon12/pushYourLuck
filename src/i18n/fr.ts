/**
 * Dictionnaire français — la référence. `en.ts` est typé d'après lui, donc une
 * clé ajoutée ici et oubliée là-bas casse la compilation.
 *
 * Uniquement des chaînes : voir la note dans `format.ts`.
 */
export const fr = {
    site: {
        name: 'Push Your Luck',
        tagline: 'Tire une carte de plus. Ou encaisse.',
        description:
            "Jeu de cartes gratuit où chaque tirage gonfle le pot et rapproche de la bombe. " +
            "Partie du jour identique pour tous, classement quotidien, aucune inscription.",
        keywords: [
            'push your luck', 'jeu de cartes', 'jeu gratuit', 'jeu navigateur',
            'jeu du jour', 'classement quotidien', 'jeu sans inscription',
            'jeu de hasard et de stratégie', 'deckbuilder', 'jeu solo',
        ],
    },

    nav: {
        leaderboard: 'Classement',
        rules: 'Règles',
        changelog: 'Nouveautés',
        skipToContent: 'Aller au contenu',
        toggleTheme: 'Changer de thème',
        switchLanguage: 'Switch to English',
        mainNav: 'Navigation principale',
        footerNav: 'Liens de bas de page',
    },

    footer: {
        tagline: 'Push Your Luck — jeu gratuit, sans inscription et sans publicité.',
        play: 'Jouer',
        legal: 'Mentions légales',
        privacy: 'Confidentialité',
        versionTitle: 'Voir les nouveautés de cette version',
        madeBy: 'Un jeu de {author}',
    },

    cards: {
        coin1: { name: 'Piécette', text: '+1 au pot' },
        coin2: { name: 'Pièce', text: '+2 au pot' },
        coin3: { name: 'Écu', text: '+3 au pot' },
        coin5: { name: 'Pépite', text: '+5 au pot' },
        coin8: { name: 'Lingot', text: '+8 au pot' },
        coin13: { name: 'Magot', text: '+13 au pot' },
        x2: { name: 'Doublon', text: 'Double le pot' },
        x3: { name: 'Triplon', text: 'Triple le pot' },
        bomb: { name: 'Bombe', text: 'La manche saute' },
        defuse: { name: 'Pince coupante', text: 'Retire une bombe du paquet' },
        sonar: { name: 'Sonar', text: 'Révèle les 3 cartes suivantes' },
        shield: { name: 'Assurance', text: 'Bombe : tu gardes la moitié' },
        greed: { name: 'Va-tout', text: '+18 au pot, mais +1 bombe' },
        magnet: { name: 'Aimant', text: '+2 par carte déjà tirée' },
    },

    game: {
        introDaily: 'Partie du jour',
        introDailyText: 'Le même paquet pour tous les joueurs, une seule tentative classée.',
        introDailyPlayed: 'Déjà jouée aujourd’hui.',
        introPlay: 'Jouer',
        introReplayUnranked: 'Rejouer sans classement',
        introFree: 'Partie libre',
        introFreeKicker: 'Sans limite',
        introFreeText: 'Paquet tiré au hasard, autant de parties que tu veux.',
        introFreeBest: 'Ton record : {score}.',

        modeDaily: 'Partie du jour',
        modeFree: 'Partie libre',
        round: 'Manche {n}',
        score: 'Score',
        livesLabel: '{n} vies restantes',
        soundOn: 'Couper le son',
        soundOff: 'Activer le son',

        riskLabel: 'Risque au prochain tirage',
        riskLabelShort: 'Risque au tirage',
        sonarLead: { one: 'Sonar — {count} carte à venir', other: 'Sonar — {count} cartes à venir' },

        pot: 'Pot en jeu',
        payout: 'Encaisser rapporte {n} points',
        potEmpty: 'Tire une carte pour ouvrir le pot',

        draw: 'Tirer',
        drawRisk: '{n} % de risque',
        bank: 'Encaisser',
        bankGain: '+{n} points',
        shortcuts: 'Espace pour tirer · E pour encaisser',

        deckTitle: 'Paquet restant',
        deckCount: { one: '{count} carte', other: '{count} cartes' },
        deckBombs: { one: '{count} bombe', other: '{count} bombes' },

        shopTitle: 'Manche encaissée',
        shopText: 'Ajoute une carte au paquet — ou passe pour le garder léger.',
        shopSkip: 'Passer',
    },

    summary: {
        finished: '{date} · terminé',
        freeFinished: 'Partie libre · terminée',
        recap: '{rounds} · {cards} sorties du paquet',
        rounds: { one: '{count} manche', other: '{count} manches' },
        cards: { one: '{count} carte', other: '{count} cartes' },
        rank: '{n}ᵉ aujourd’hui',
        unranked:
            'Tentative d’entraînement — ta partie classée du jour est déjà jouée. ' +
            'Reviens demain pour un nouveau paquet.',
        namePlaceholder: 'Ton pseudo',
        nameLabel: 'Pseudo pour le classement',
        submit: 'Classer mon score',
        saved: 'Score enregistré.',
        keptBest: 'Ton meilleur score du jour reste {best}.',
        errorSend: 'envoi impossible',
        errorServer: 'serveur injoignable',
        errors: {
            invalid_body: 'requête illisible',
            invalid_mode: 'mode de jeu inconnu',
            invalid_name: 'pseudo invalide — deux caractères minimum',
            blocked_name: 'ce pseudo n’est pas autorisé, choisis-en un autre',
            invalid_client: 'identifiant de navigateur invalide',
            invalid_seed: 'paquet invalide',
            replay_rejected: 'partie refusée par la vérification du serveur',
        },
        share: 'Partager',
        shared: 'Copié',
        replay: 'Rejouer',
        nextDeck: 'Prochain paquet dans {time}',
        boardDaily: 'Classement du jour',
        boardFree: 'Meilleurs scores libres',
        boardLoading: 'Chargement…',
        boardEmpty: 'Personne encore. La première place est libre.',
        shareText: 'Push Your Luck — {context}\n{score} points en {rounds}\n{url}',
        shareFree: 'partie libre',
    },

    home: {
        title: 'Push Your Luck — Tire une carte de plus. Ou encaisse.',
        h1: 'Push Your Luck',
        lead:
            'Chaque carte tirée gonfle le pot et rapproche de la bombe. ' +
            'Encaisse trop tôt tu ne marques rien, trop tard tu perds tout.',
        s1Title: 'Le principe en trois phrases',
        s1Body:
            "Tu retournes les cartes d’un paquet une par une. Les pièces remplissent le pot, " +
            "les multiplicateurs le font gonfler, et cinq bombes attendent quelque part dedans. " +
            "Tant que tu n’as pas encaissé, tout ce que tu as accumulé peut disparaître d’un seul tirage.",
        s2Title: 'Pourquoi ce n’est pas qu’un jeu de hasard',
        s2Body:
            "La composition du paquet est affichée en permanence : tu connais le nombre exact de " +
            "bombes restantes, donc la probabilité exacte du prochain tirage. Et surtout, encaisser " +
            "retire définitivement du paquet les cartes que tu viens de tirer — ce sont toujours de " +
            "bonnes cartes. Chaque encaissement rend donc le paquet plus dangereux pour la suite. " +
            "La vraie question n’est jamais « est-ce que je tire encore ? » mais " +
            "« combien de fois puis-je encore me permettre d’encaisser ? ».",
        s3Title: 'Une partie du jour pour tout le monde',
        s3Body:
            "Chaque jour à minuit, un nouveau paquet est tiré — le même pour tous les joueurs. " +
            "Une seule tentative compte au {leaderboard}, et les scores sont vérifiés côté serveur " +
            "en rejouant la partie. Le mode libre, lui, est illimité. Aucun compte à créer, rien à installer.",
        s3Link: 'classement du jour',
        rulesLine: 'Les règles complètes, l’effet de chaque carte et les stratégies de base sont sur la {link}.',
        rulesLink: 'page des règles',
    },

    rules: {
        title: 'Règles du jeu',
        description:
            "Toutes les règles de Push Your Luck : composition du paquet, effet de chaque carte, " +
            "prime d’enchaînement, boutique entre les manches et conseils de stratégie.",
        lead: 'Tout ce qu’il faut savoir pour jouer, et les quelques subtilités qui font la différence.',
        turnTitle: 'Le tour de jeu',
        turnDraw: 'Tirer.',
        turnDrawText: 'Tu retournes la carte du dessus du paquet. Elle ajoute au pot, le multiplie, ou elle explose.',
        turnBank: 'Encaisser.',
        turnBankText: 'Le pot part au score, définitivement. La manche s’arrête et tu passes à la boutique.',
        turnBust: 'Sauter.',
        turnBustText: 'Sur une bombe, le pot est perdu et tu perds une vie. Tu en as {lives} ; à zéro, la partie est finie.',
        bonusTitle: 'La prime d’enchaînement',
        bonusBody:
            "Chaque carte supplémentaire tirée dans la manche augmente de {growth} % la valeur de " +
            "l’encaissement — et l’effet est cumulatif. Encaisser après six cartes vaut donc près du " +
            "double du même pot encaissé après une seule. C’est ce qui rend l’attente payante, et " +
            "c’est le seul arbitrage qui compte vraiment.",
        twistTitle: 'La règle qu’on découvre trop tard',
        twistBody:
            "Encaisser retire {strong} les cartes tirées pendant la manche. Comme une manche encaissée " +
            "ne contient jamais de bombe, ce sont toujours de bonnes cartes qui disparaissent : le paquet " +
            "devient mécaniquement plus dangereux à chaque encaissement. Sauter sur une bombe, au " +
            "contraire, remet tout dans le paquet. Le paquet de départ compte {deck} cartes dont {bombs} bombes.",
        twistStrong: 'définitivement du paquet',
        cardsTitle: 'Toutes les cartes',
        colCard: 'Carte',
        colEffect: 'Effet',
        tipsTitle: 'Trois conseils pour progresser',
        tip1: 'Regarde la jauge de risque, pas ton intuition : elle affiche la probabilité réelle.',
        tip2:
            'Une Pince coupante vaut souvent mieux qu’un gros gain : retirer une bombe améliore ' +
            'toutes tes manches suivantes, un Magot n’en améliore qu’une.',
        tip3:
            'Sur la fin, quand le paquet est saturé de bombes, encaisse tôt : la prime ' +
            'd’enchaînement ne compense plus un risque de 40 %.',
        faqTitle: 'Questions fréquentes',
        playNow: 'Jouer maintenant',
        faq: [
            {
                q: 'Push Your Luck est-il gratuit ?',
                a: "Oui, entièrement. Pas de compte à créer, pas de publicité, pas d’achat intégré. Le jeu se lance directement dans le navigateur.",
            },
            {
                q: 'Comment fonctionne la partie du jour ?',
                a: "Chaque jour à minuit (heure de Paris), un nouveau paquet est tiré et il est identique pour tous les joueurs. Une seule tentative est classée, ce qui rend les scores comparables.",
            },
            {
                q: 'Peut-on tricher au classement ?',
                a: "Le score n’est pas envoyé par le navigateur : le serveur rejoue la suite d’actions du joueur depuis la graine du jour et recalcule lui-même le résultat. Une suite d’actions inventée est rejetée.",
            },
            {
                q: "Est-ce un jeu de hasard ou d’adresse ?",
                a: "Les deux, mais l’information est complète : la composition exacte du paquet restant est affichée en permanence, donc la probabilité du prochain tirage est connue. Sur la durée, la façon de gérer le paquet compte davantage que la chance.",
            },
            {
                q: 'Le jeu marche-t-il sur mobile ?',
                a: "Oui. L’interface est pensée pour une main, en portrait, et le jeu peut être installé comme application depuis le navigateur.",
            },
        ],
    },

    leaderboard: {
        title: 'Classement du jour',
        description:
            "Le classement quotidien de Push Your Luck : les meilleurs scores du jour sur le paquet " +
            "commun à tous les joueurs, plus les records du mode libre.",
        lead: '{date} — même paquet pour tous, une tentative classée par joueur.',
        empty: 'Aucun score aujourd’hui. La première place est à prendre.',
        emptyCta: 'Jouer la partie du jour',
        rounds: { one: '{count} manche', other: '{count} manches' },
        freeTitle: 'Records en partie libre',
        freeLead: 'Tous paquets confondus, depuis toujours.',
        calendarTitle: 'Calendrier des meilleurs scores',
        calendarLead: 'Le meilleur score obtenu chaque jour du mois sur le paquet du jour.',
        calendarEmpty: 'Aucun score enregistré ce mois-ci.',
        calendarBest: 'Meilleur score du {date} : {score} points en {rounds}, par {name}',
        calendarNoScore: 'Aucun score le {date}',
        roundsAbbr: 'm.',
        calendarPrevMonth: 'Mois précédent',
        calendarNextMonth: 'Mois suivant',
        calendarPrevYear: 'Année précédente',
        calendarNextYear: 'Année suivante',
        calendarBackToday: 'Revenir au mois en cours',
    },

    changelog: {
        title: 'Nouveautés',
        description:
            "Toutes les mises à jour de Push Your Luck : nouvelles cartes, équilibrage, " +
            "corrections et améliorations, du plus récent au plus ancien.",
        lead: 'Ce qui a changé dans le jeu, de la version la plus récente à la plus ancienne.',
        tags: {
            feature: 'Nouveauté',
            balance: 'Équilibrage',
            fix: 'Correction',
        },
    },

    legal: {
        title: 'Mentions légales',
        description: 'Éditeur, hébergeur et conditions d’utilisation du site Push Your Luck.',
        editorTitle: 'Éditeur du site',
        editorBody:
            'Le site {site} est édité à titre personnel et non commercial par {author}. ' +
            'Contact : {email}.',
        hostTitle: 'Hébergement',
        hostBody:
            'Le site est hébergé sur un serveur dédié loué par l’éditeur. ' +
            'Le nom et les coordonnées de l’hébergeur sont communiqués sur simple demande à l’adresse ci-dessus.',
        ipTitle: 'Propriété intellectuelle',
        ipBody:
            'Les règles, textes, visuels et le code du jeu sont l’œuvre de l’éditeur. ' +
            'Les icônes proviennent de la bibliothèque Lucide, distribuée sous licence ISC. ' +
            'Toute reproduction du contenu du site sans autorisation est interdite.',
        liabilityTitle: 'Responsabilité',
        liabilityBody:
            'Le jeu est fourni tel quel, sans garantie de disponibilité. L’éditeur ne saurait être ' +
            'tenu responsable d’une interruption de service ou de la perte des scores enregistrés.',
        ageTitle: 'Public et argent réel',
        ageBody:
            'Push Your Luck est un jeu de score sans mise, sans gain et sans aucune transaction ' +
            'financière. Ce n’est pas un jeu d’argent et il ne donne accès à aucun service de ce type.',
        updated: 'Dernière mise à jour : {date}.',
    },

    privacy: {
        title: 'Politique de confidentialité',
        description:
            'Quelles données Push Your Luck enregistre, pourquoi, et comment en demander la suppression.',
        lead: 'Version courte : aucun compte, aucun traceur publicitaire, et le strict minimum en base.',
        storedTitle: 'Ce qui est enregistré',
        storedIntro: 'Uniquement lorsque tu choisis d’envoyer un score au classement :',
        stored1: 'le pseudo que tu saisis — choisis-en un qui ne t’identifie pas si tu préfères rester anonyme ;',
        stored2: 'ton score, le nombre de manches et la date de la partie ;',
        stored3:
            'un identifiant aléatoire créé par ton navigateur, qui sert uniquement à limiter le ' +
            'classement à un score par joueur et par jour. Il n’est relié à aucune donnée personnelle.',
        localTitle: 'Ce qui reste sur ton appareil',
        localBody:
            'Ton thème, ton réglage de son, ton pseudo, ton record en partie libre et la date de ta ' +
            'dernière partie classée sont stockés dans le stockage local de ton navigateur. ' +
            'Ces informations ne quittent jamais ton appareil et disparaissent si tu vides ton navigateur.',
        cookiesTitle: 'Cookies et mesure d’audience',
        cookiesBody:
            'Le site ne dépose aucun cookie et n’utilise aucun traceur publicitaire. La ' +
            'fréquentation est mesurée par une instance Matomo hébergée par l’éditeur, configurée ' +
            'sans cookie et avec anonymisation de l’adresse IP : rien n’est recoupé entre sites, ' +
            'rien n’est transmis à un tiers, et la mesure ne sert qu’à savoir quelles pages sont ' +
            'consultées. Cette configuration est exemptée de consentement, c’est pourquoi aucune ' +
            'bannière ne t’est présentée.',
        rightsTitle: 'Tes droits',
        rightsBody:
            'Tu peux demander la suppression d’une entrée du classement en écrivant à {email}, ' +
            'en précisant le pseudo et la date concernés. La demande est traitée sous 30 jours.',
        retentionTitle: 'Durée de conservation',
        retentionBody:
            'Les scores quotidiens sont conservés un an, le temps de garder un historique lisible ' +
            'des classements. Au-delà, ils sont supprimés.',
        updated: 'Dernière mise à jour : {date}.',
    },
} as const;
