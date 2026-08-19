import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: { path: 'prisma/migrations' },
    datasource: {
        // Volontairement tolérant à l'absence de variable : `prisma generate`
        // ne se connecte à rien, et `env()` lèverait une erreur à la lecture de
        // ce fichier. Exiger l'URL ici ferait échouer la génération du client
        // sur un poste fraîchement cloné comme en intégration continue, là où
        // seule la compilation est en jeu. Les commandes qui ont réellement
        // besoin d'une base (`db push`, `migrate`) échoueront d'elles-mêmes.
        url: process.env.DATABASE_URL ?? '',
    },
});
