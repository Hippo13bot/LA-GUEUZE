# LA GUEUZE V3
*Tout le tournage. Dans ta poche.* — by @hipo.reporter

## Configuration actuellement déployée

LA GUEUZE est reconnectée au projet Supabase existant **hippomoamias@gmail.com's Project** (référence `cpczqpyiizlbowesdkig`). Aucun nouveau projet n'a été créé.

Le schéma LA GUEUZE utilise uniquement des tables préfixées `gueuze_*`. Les tables `caverne_*` existantes sont conservées et ne sont ni renommées ni modifiées par les migrations LA GUEUZE. La table `caverne_public_catalog` est utilisée en lecture seule par l'onglet Matériel.

La migration autonome a été installée directement sur le projet : productions, membres et rôles, feuilles de service, historique, journal, lieux, contacts, talkies, matériel, QR temporaires et stockage privé. Les tables LA GUEUZE ont RLS activé ; les accès anonymes aux tables sont révoqués. Le RPC du portail QR reste accessible anonymement pour afficher uniquement les feuilles publiées via un jeton valide.

## Authentification

Les comptes Supabase Auth de ce projet sont communs aux applications qui utilisent ce même projet, notamment La Caverne. Connecte-toi avec un compte déjà existant dans ce projet, ou crée un compte si nécessaire.

Dans Supabase → Authentication → URL Configuration, vérifie que l'URL du site et les Redirect URLs autorisent :
`https://hippo13bot.github.io/LA-GUEUZE/`

Ne publie jamais de clé `service_role`. La clé publishable présente dans `config/supabase.js` est une clé publique destinée au navigateur.

## Fonctionnalités

- Authentification : inscription, connexion, déconnexion, réinitialisation du mot de passe.
- Productions, rôles et gestion d'équipe (ajout d'un compte existant par e-mail).
- Feuilles de service : brouillon, validation, publication et historique des versions.
- Synchronisation en direct et PWA.
- Lieux et cartes, annuaire, talkies, matériel (catalogue La Caverne en lecture + liste de souhaits).
- Documents dans un bucket privé.
- Import PDF assisté (texte uniquement, à vérifier avant publication), impression/export PDF.
- QR temporaires, révocables, avec accès public limité aux feuilles publiées.

## Déploiement

Le site est publié par GitHub Actions / GitHub Pages depuis `main` :
https://hippo13bot.github.io/LA-GUEUZE/

Sur iPhone : ouvrir l'URL dans Safari → Partager → Sur l'écran d'accueil.

## Limites connues

- Pas d'OCR pour les scans PDF.
- La réservation réelle du matériel dans La Caverne n'est pas automatisée : l'onglet LA GUEUZE crée une liste de souhaits.
- L'annuaire n'est pas synchronisé avec Répertoire.
- Builds Mac/Windows à revalider après les prochaines évolutions.
- Les QR donnent accès aux feuilles publiées sans connexion, jamais à l'annuaire ni aux documents.
- Pas d'IA.
