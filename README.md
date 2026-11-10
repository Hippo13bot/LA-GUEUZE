# LA GUEUZE — V1 prototype

**LA GUEUZE — Tout le tournage. Dans ta poche.**  
by @hipo.reporter

## Déploiement GitHub Pages

Cette première version est un site statique : aucun build local ni commande npm n'est nécessaire.

1. Décompresser l'archive.
2. Copier **tout le contenu de ce dossier** à la racine du dépôt GitHub (y compris `assets/`, `manifest.webmanifest` et `sw.js`).
3. Conserver les éventuels dossiers cachés déjà présents dans le dépôt, notamment `.github/`.
4. Valider avec **Commit changes**.
5. Attendre la fin du déploiement GitHub Pages, puis ouvrir le site.

## Contenu de cette version

- Interface responsive ordinateur / tablette / téléphone.
- Navigation : Aujourd'hui, Productions, Feuilles de service, Équipe, Lieux, Talkies-walkies, Matériel, Le Stagiaire, Réglages.
- Création locale de productions, feuilles, contacts, lieux, canaux et besoins matériels.
- Recherche dans les tableaux.
- Import de document : ajout à une file de préparation (pas encore d'OCR).
- Export JSON des données locales.
- Stockage navigateur et cache hors connexion (sur l'appareil utilisé).

## Limites à connaître

Ceci est un **prototype fonctionnel d'interface**, pas encore la version multi-utilisateur en production. Les données sont stockées dans le navigateur de chaque appareil. L'authentification HIPPO CORE, la synchronisation Supabase, les permissions, le partage QR sécurisé, l'OCR, la météo, les notifications et l'assistant IA réel restent à intégrer et à tester avant un usage de tournage réel.

Aucune connexion aux projets Supabase existants n'est effectuée dans cette version. Aucune donnée des applications existantes n'est modifiée.
