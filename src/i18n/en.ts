import type { Dictionary } from './dictionary';

/** English dictionary. Typed against `fr.ts`: a missing key breaks the build. */
export const en: Dictionary = {
    site: {
        name: 'Push Your Luck',
        tagline: 'Draw one more card. Or bank it.',
        description:
            'Free card game where every draw grows the pot and brings the bomb closer. ' +
            'One daily deck shared by all players, a daily leaderboard, no sign-up.',
        keywords: [
            'push your luck', 'card game', 'free game', 'browser game',
            'daily game', 'daily leaderboard', 'no sign-up game',
            'luck and strategy game', 'deckbuilder', 'single player game',
        ],
    },

    nav: {
        leaderboard: 'Leaderboard',
        rules: 'Rules',
        changelog: 'Changelog',
        skipToContent: 'Skip to content',
        toggleTheme: 'Switch theme',
        switchLanguage: 'Passer en français',
        mainNav: 'Main navigation',
        footerNav: 'Footer links',
    },

    footer: {
        tagline: 'Push Your Luck — free to play, no sign-up, no ads.',
        play: 'Play',
        legal: 'Legal notice',
        privacy: 'Privacy',
        versionTitle: 'See what changed in this version',
        madeBy: 'A game by {author}',
    },

    cards: {
        coin1: { name: 'Penny', text: '+1 to the pot' },
        coin2: { name: 'Coin', text: '+2 to the pot' },
        coin3: { name: 'Shilling', text: '+3 to the pot' },
        coin5: { name: 'Nugget', text: '+5 to the pot' },
        coin8: { name: 'Ingot', text: '+8 to the pot' },
        coin13: { name: 'Hoard', text: '+13 to the pot' },
        x2: { name: 'Doubler', text: 'Doubles the pot' },
        x3: { name: 'Tripler', text: 'Triples the pot' },
        bomb: { name: 'Bomb', text: 'The round blows up' },
        defuse: { name: 'Wire cutters', text: 'Removes a bomb from the deck' },
        sonar: { name: 'Sonar', text: 'Reveals the next 3 cards' },
        shield: { name: 'Insurance', text: 'On a bomb, you keep half' },
        greed: { name: 'All-in', text: '+18 to the pot, but +1 bomb' },
        magnet: { name: 'Magnet', text: '+2 per card already drawn' },
    },

    game: {
        introDaily: 'Daily game',
        introDailyText: 'The same deck for every player, one ranked attempt.',
        introDailyPlayed: 'Already played today.',
        introPlay: 'Play',
        introReplayUnranked: 'Play again, unranked',
        introFree: 'Free play',
        introFreeKicker: 'Unlimited',
        introFreeText: 'A random deck, as many games as you want.',
        introFreeBest: 'Your best: {score}.',

        modeDaily: 'Daily game',
        modeFree: 'Free play',
        round: 'Round {n}',
        score: 'Score',
        livesLabel: '{n} lives left',
        soundOn: 'Mute sound',
        soundOff: 'Unmute sound',

        riskLabel: 'Risk on the next draw',
        riskLabelShort: 'Draw risk',
        sonarLead: { one: 'Sonar — {count} card ahead', other: 'Sonar — {count} cards ahead' },

        pot: 'Pot at stake',
        payout: 'Banking pays {n} points',
        potEmpty: 'Draw a card to open the pot',

        draw: 'Draw',
        drawRisk: '{n}% risk',
        bank: 'Bank',
        bankGain: '+{n} points',
        shortcuts: 'Space to draw · E to bank',

        deckTitle: 'Deck left',
        deckCount: { one: '{count} card', other: '{count} cards' },
        deckBombs: { one: '{count} bomb', other: '{count} bombs' },

        shopTitle: 'Round banked',
        shopText: 'Add a card to the deck — or skip to keep it lean.',
        shopSkip: 'Skip',
    },

    summary: {
        finished: '{date} · finished',
        freeFinished: 'Free play · finished',
        recap: '{rounds} · {cards} out of the deck',
        rounds: { one: '{count} round', other: '{count} rounds' },
        cards: { one: '{count} card', other: '{count} cards' },
        rank: 'Rank {n} today',
        unranked:
            'Practice run — your ranked game for today has already been played. ' +
            'Come back tomorrow for a new deck.',
        namePlaceholder: 'Your name',
        nameLabel: 'Name for the leaderboard',
        submit: 'Submit my score',
        saved: 'Score saved.',
        keptBest: 'Your best score today stays {best}.',
        errorSend: 'could not send',
        errorServer: 'server unreachable',
        errors: {
            invalid_body: 'unreadable request',
            invalid_mode: 'unknown game mode',
            invalid_name: 'invalid name — two characters minimum',
            blocked_name: 'that name is not allowed, please pick another',
            invalid_client: 'invalid browser identifier',
            invalid_seed: 'invalid deck',
            replay_rejected: 'game rejected by the server check',
        },
        share: 'Share',
        shared: 'Copied',
        replay: 'Play again',
        nextDeck: 'Next deck in {time}',
        boardDaily: 'Today’s leaderboard',
        boardFree: 'Best free-play scores',
        boardLoading: 'Loading…',
        boardEmpty: 'Nobody yet. First place is up for grabs.',
        shareText: 'Push Your Luck — {context}\n{score} points in {rounds}\n{url}',
        shareFree: 'free play',
    },

    home: {
        title: 'Push Your Luck — Draw one more card. Or bank it.',
        h1: 'Push Your Luck',
        lead:
            'Every card you draw grows the pot and brings the bomb closer. ' +
            'Bank too early and you score nothing, too late and you lose everything.',
        s1Title: 'The idea in three sentences',
        s1Body:
            'You flip the cards of a deck one at a time. Coins fill the pot, multipliers inflate it, ' +
            'and five bombs are waiting somewhere inside. Until you bank, everything you have piled ' +
            'up can vanish on a single draw.',
        s2Title: 'Why this is not just a game of chance',
        s2Body:
            'The composition of the deck is on screen at all times: you know exactly how many bombs ' +
            'are left, so you know the exact odds of the next draw. And crucially, banking permanently ' +
            'removes the cards you just drew — always good ones. Every time you bank, the deck gets ' +
            'more dangerous. The real question is never “do I draw again?” but ' +
            '“how many more times can I afford to bank?”.',
        s3Title: 'One daily game for everyone',
        s3Body:
            'Every day at midnight a new deck is dealt — the same one for every player. Only one ' +
            'attempt counts towards the {leaderboard}, and scores are verified server-side by ' +
            'replaying the game. Free play is unlimited. No account to create, nothing to install.',
        s3Link: 'daily leaderboard',
        rulesLine: 'Full rules, the effect of every card and the basic strategies are on the {link}.',
        rulesLink: 'rules page',
    },

    rules: {
        title: 'Game rules',
        description:
            'All the rules of Push Your Luck: deck composition, the effect of every card, the ' +
            'streak bonus, the shop between rounds and strategy tips.',
        lead: 'Everything you need to play, plus the few subtleties that make the difference.',
        turnTitle: 'A turn of play',
        turnDraw: 'Draw.',
        turnDrawText: 'You flip the top card of the deck. It adds to the pot, multiplies it, or it explodes.',
        turnBank: 'Bank.',
        turnBankText: 'The pot goes to your score for good. The round ends and you move on to the shop.',
        turnBust: 'Bust.',
        turnBustText: 'On a bomb, the pot is lost and you lose a life. You have {lives}; at zero, the game is over.',
        bonusTitle: 'The streak bonus',
        bonusBody:
            'Every extra card drawn in a round raises the value of banking by {growth}% — and the ' +
            'effect compounds. Banking after six cards is therefore worth nearly double the same pot ' +
            'banked after one. That is what makes waiting pay off, and it is the only trade-off that ' +
            'truly matters.',
        twistTitle: 'The rule people learn too late',
        twistBody:
            'Banking removes {strong} the cards drawn during the round. Since a banked round never ' +
            'contains a bomb, it is always good cards that disappear: the deck mechanically becomes ' +
            'more dangerous every time you bank. Busting on a bomb, on the other hand, puts everything ' +
            'back. The starting deck holds {deck} cards including {bombs} bombs.',
        twistStrong: 'permanently from the deck',
        cardsTitle: 'Every card',
        colCard: 'Card',
        colEffect: 'Effect',
        tipsTitle: 'Three tips to improve',
        tip1: 'Watch the risk gauge, not your gut: it shows the real probability.',
        tip2:
            'Wire cutters are often worth more than a big payout: removing a bomb improves every ' +
            'round that follows, whereas a Hoard improves only one.',
        tip3:
            'Late in a game, when the deck is thick with bombs, bank early: the streak bonus no ' +
            'longer offsets a 40% risk.',
        faqTitle: 'Frequently asked questions',
        playNow: 'Play now',
        faq: [
            {
                q: 'Is Push Your Luck free?',
                a: 'Entirely. No account, no ads, no in-app purchases. The game runs straight in your browser.',
            },
            {
                q: 'How does the daily game work?',
                a: 'Every day at midnight (Paris time) a new deck is dealt, identical for every player. Only one attempt is ranked, which keeps scores comparable.',
            },
            {
                q: 'Can the leaderboard be cheated?',
                a: 'The score is not sent by the browser: the server replays the player’s sequence of actions from the daily seed and recomputes the result itself. A made-up sequence is rejected.',
            },
            {
                q: 'Is it a game of luck or skill?',
                a: 'Both, but the information is complete: the exact composition of the remaining deck is always on screen, so the odds of the next draw are known. Over time, how you manage the deck matters more than luck.',
            },
            {
                q: 'Does it work on mobile?',
                a: 'Yes. The interface is built for one hand in portrait, and the game can be installed as an app from your browser.',
            },
        ],
    },

    leaderboard: {
        title: 'Daily leaderboard',
        description:
            'The daily leaderboard of Push Your Luck: today’s best scores on the deck shared by ' +
            'every player, plus the all-time free-play records.',
        lead: '{date} — same deck for everyone, one ranked attempt per player.',
        empty: 'No score today. First place is up for grabs.',
        emptyCta: 'Play the daily game',
        rounds: { one: '{count} round', other: '{count} rounds' },
        freeTitle: 'Free-play records',
        freeLead: 'All decks, all time.',
        calendarTitle: 'Best scores calendar',
        calendarLead: 'The best score posted on each day’s deck this month.',
        calendarEmpty: 'No score recorded this month.',
        calendarBest: 'Best score on {date}: {score} points in {rounds}, by {name}',
        calendarNoScore: 'No score on {date}',
        roundsAbbr: 'r.',
        calendarPrevMonth: 'Previous month',
        calendarNextMonth: 'Next month',
        calendarPrevYear: 'Previous year',
        calendarNextYear: 'Next year',
        calendarBackToday: 'Back to the current month',
    },

    changelog: {
        title: 'Changelog',
        description:
            'Every update to Push Your Luck: new cards, balance changes, fixes and improvements, ' +
            'newest first.',
        lead: 'What changed in the game, from the most recent version to the oldest.',
        tags: {
            feature: 'New',
            balance: 'Balance',
            fix: 'Fix',
        },
    },

    legal: {
        title: 'Legal notice',
        description: 'Publisher, hosting and terms of use for the Push Your Luck website.',
        editorTitle: 'Publisher',
        editorBody:
            'The {site} website is published on a personal, non-commercial basis by {author}. ' +
            'Contact: {email}.',
        hostTitle: 'Hosting',
        hostBody:
            'The site is hosted on a dedicated server rented by the publisher. The name and contact ' +
            'details of the host are available on request at the address above.',
        ipTitle: 'Intellectual property',
        ipBody:
            'The rules, texts, visuals and code of the game are the work of the publisher. Icons come ' +
            'from the Lucide library, distributed under the ISC licence. Reproducing the contents of ' +
            'this site without permission is prohibited.',
        liabilityTitle: 'Liability',
        liabilityBody:
            'The game is provided as is, with no guarantee of availability. The publisher cannot be ' +
            'held liable for any service interruption or loss of recorded scores.',
        ageTitle: 'Audience and real money',
        ageBody:
            'Push Your Luck is a score game with no stake, no winnings and no financial transaction ' +
            'of any kind. It is not gambling and gives access to no such service.',
        updated: 'Last updated: {date}.',
    },

    privacy: {
        title: 'Privacy policy',
        description: 'What Push Your Luck stores, why, and how to ask for it to be deleted.',
        lead: 'Short version: no account, no advertising tracker, and the bare minimum in the database.',
        storedTitle: 'What gets stored',
        storedIntro: 'Only when you choose to submit a score to the leaderboard:',
        stored1: 'the name you type — pick one that does not identify you if you would rather stay anonymous;',
        stored2: 'your score, the number of rounds and the date of the game;',
        stored3:
            'a random identifier created by your browser, used solely to limit the leaderboard to one ' +
            'score per player per day. It is linked to no personal data.',
        localTitle: 'What stays on your device',
        localBody:
            'Your theme, sound setting, name, free-play record and the date of your last ranked game ' +
            'are kept in your browser’s local storage. That information never leaves your device and ' +
            'disappears if you clear your browser.',
        cookiesTitle: 'Cookies and analytics',
        cookiesBody:
            'The site sets no cookies and uses no advertising tracker. Traffic is measured by a ' +
            'Matomo instance hosted by the publisher, configured without cookies and with IP ' +
            'anonymisation: nothing is correlated across sites, nothing is passed to a third party, ' +
            'and the measurement only records which pages are visited. This configuration is exempt ' +
            'from consent, which is why you are never shown a banner.',
        rightsTitle: 'Your rights',
        rightsBody:
            'You can ask for a leaderboard entry to be deleted by writing to {email}, quoting the name ' +
            'and date concerned. Requests are handled within 30 days.',
        retentionTitle: 'Retention',
        retentionBody:
            'Daily scores are kept for one year, long enough to keep a readable history of the ' +
            'leaderboards. After that they are deleted.',
        updated: 'Last updated: {date}.',
    },
};
