/**
 * Identité du site indépendante de la langue.
 *
 * Tout ce qui est TEXTE (accroche, description, mots-clés) vit dans les
 * dictionnaires `i18n/` : le dupliquer ici garantirait qu'une des deux copies
 * finisse par mentir.
 */
export const site = {
    name: 'Push Your Luck',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pushyourluck.net',
    author: { name: 'Leo Deroin', url: 'https://leoderoin.fr' },
    // Adresse déjà publique (auteur du dépôt loupsgarous) plutôt qu'une adresse
    // privée : les mentions légales et la politique de confidentialité doivent
    // exposer un contact joignable.
    contact: 'contact@leoderoin.fr',
} as const;

export const absoluteUrl = (path = '/') => new URL(path, site.url).toString();
