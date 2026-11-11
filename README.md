# LA GUEUZE V2 — by @hipo.reporter

**Tout le tournage. Dans ta poche.**

Version de reprise de la V1 fournie. Le GIF fourni est conservé tel quel dans `assets/gueuze-identity.gif` et utilisé dans l'interface. Les icônes de systèmes restent statiques (`icon-192.png`, `icon-512.png`).

## Déploiement web / GitHub Pages (sans Terminal sur ton Mac)

1. Décompresse `LA_GUEUZE_V2.zip`.
2. Dépose **tout le contenu** à la racine du dépôt GitHub (y compris les dossiers cachés `.github`, `desktop`, `supabase`, `config` et `assets`).
3. Fais un commit sur `main` ou `master`.
4. Dans GitHub → Settings → Pages, sélectionne **GitHub Actions** comme source si ce n'est pas déjà fait.
5. Le workflow `pages.yml` publie le site automatiquement.

Le site est une PWA : sur iPhone, ouvre l'URL publiée dans Safari → Partager → Sur l'écran d'accueil. La disponibilité hors ligne dépend du chargement initial et du cache du navigateur.

## Applications macOS et Windows

Le workflow `desktop.yml` construit les paquets sur les runners GitHub :
- Déclenchement manuel : Actions → « Construire les applications Mac et Windows » → Run workflow.
- Ou pousse un tag Git commençant par `v` (ex. `v2.0.0`).
- Les installateurs sont publiés comme artefacts téléchargeables dans l'exécution GitHub Actions.

Le wrapper Electron ouvre les mêmes écrans web localement. Il n'ajoute pas encore de notifications natives ni de synchronisation. La signature/notarisation Apple n'est pas configurée : macOS peut afficher un avertissement à l'ouverture. Une signature de distribution nécessite des certificats Apple Developer stockés dans les secrets GitHub.

## GIF et icônes

- `assets/gueuze-identity.gif` : fichier original fourni, conservé sans modification (480 × 270, 1 image).
- `icon-192.png` et `icon-512.png` : icônes statiques générées à partir de l'image fournie, pour les contraintes PWA/iOS.
- `icon.svg` : icône vectorielle historique conservée en secours.

## HIPPO CORE / Supabase

Projet central préconfiguré : `zbfwjeolxntgpfxyfryn` (`https://zbfwjeolxntgpfxyfryn.supabase.co`).

**Aucune connexion réseau Supabase n'est activée dans cette livraison.** La structure V1 ne documente pas le schéma des autres applications et aucun accès au projet Supabase n'a été fourni. Pour éviter d'écraser des données ou de supposer une correspondance d'identité, la migration proposée crée uniquement des tables `gueuze_*` séparées.

Avant activation :
1. Vérifier le schéma HIPPO CORE existant et les conventions d'identité partagée.
2. Vérifier les politiques RLS et les rôles avec un compte de test.
3. Examiner `supabase/migrations/202611110001_gueuze_core.sql`.
4. Sauvegarder le projet, puis exécuter manuellement la migration si elle est validée.
5. Configurer une clé publishable/anon dans `config/supabase.js` (copie de `config/supabase.example.js`). La clé publique n'est pas un secret, mais RLS doit protéger toutes les données.
6. Ne jamais exposer `service_role`. Ne pas fusionner des utilisateurs sur la seule base de leur e-mail.

La migration n'est pas exécutée automatiquement et ne modifie aucune table existante. Les jetons QR ne sont pas émis par le client : leur gestion nécessite une Edge Function sécurisée côté serveur.

## Ce qui fonctionne dans cette V2

- Base d'interface V1 conservée : tableau de bord, productions, feuilles, équipe, lieux, talkies, besoins matériels, Le Stagiaire et réglages.
- Création locale des productions, feuilles de service, contacts, lieux, canaux et besoins matériels.
- Recherche dans les tableaux, export JSON, stockage local navigateur.
- Import de document dans la file de préparation (métadonnées du fichier uniquement ; pas d'extraction du PDF).
- Interface responsive et installation PWA.
- GIF original intégré dans la marque.
- Portail QR de précaution : aucune donnée de production n'est révélée par un simple lien.
- Wrapper Electron et workflows GitHub Actions pour produire les builds macOS et Windows.
- Migration SQL additive proposée, avec RLS de base sur les nouvelles tables.

## Pas encore opérationnel — ne pas utiliser comme si c'était terminé

- Authentification HIPPO CORE et synchronisation multi-appareils : non branchées.
- Connexion aux applications Répertoire et La Caverne d'Ali Baba : non branchée ; le matériel reste une liste locale de besoins, pas un inventaire.
- Portail QR avec jetons, authentification, renouvellement et révocation : interface de garde-fou seulement ; Edge Function à développer.
- OCR / extraction PDF et validation intelligente : non implémentés.
- Assistant IA « Le Stagiaire » : interface descriptive, aucune IA exécutée.
- Notifications push, météo, carte interactive et partage par département : non implémentés.
- Gestion complète des rôles et édition distante : à développer et tester.
- Les applications desktop doivent être construites par GitHub Actions avant installation.

## Structure

- `index.html`, `app.js`, `styles.css` : application web conservée et améliorée visuellement.
- `assets/` : GIF source et icônes.
- `portal.html` : écran de portail QR sans exposition de données.
- `desktop/` : wrapper Electron sécurisé.
- `.github/workflows/` : déploiement Pages et builds desktop.
- `supabase/migrations/` : migration additive à examiner.
- `config/` : exemple de configuration Supabase.

## Données et sauvegardes

Les données de l'interface V1 restent dans le stockage local de chaque navigateur. Utilise le bouton d'export JSON avant de changer d'appareil ou de navigateur. Le bouton « Réinitialiser » efface les données locales de démonstration : ne l'utilise pas si tu souhaites les conserver.
