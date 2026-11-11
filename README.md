# LA GUEUZE V3 — lot 1 (cœur)
*Tout le tournage. Dans ta poche.* — by @hipo.reporter

## Contenu du lot 1
Authentification Supabase (inscription, connexion, déconnexion, mot de passe oublié, session persistante), productions, équipe et rôles (ajout d'un compte **existant** par e-mail), feuilles de service manuelles (brouillon → validée → publiée, historique des versions, journal), synchronisation en direct (Realtime) avec indicateur de dernière synchro, PWA, RLS.
**Pas encore (lots 2 et 3)** : import PDF, lieux/cartes, annuaire Répertoire, matériel Caverne, documents, talkies, portail QR, builds desktop validés, manuel PDF. Pas d'IA (Le Stagiaire retiré).

## Mise en route (5 étapes)
1. **Supabase** → SQL Editor → colle et exécute `supabase/migrations/202611110002_gueuze_lot1.sql` (additif, ne touche à aucune table existante).
2. Supabase → Project Settings → API : copie l'URL et la clé **publishable/anon** (jamais la `service_role`).
3. Copie `config/supabase.example.js` en `config/supabase.js` et colle la clé. Ce fichier est public par nature, c'est normal.
4. Supabase → Authentication → URL Configuration : ajoute `https://hippo13bot.github.io/LA-GUEUZE/` dans *Site URL* et *Redirect URLs* (sinon les liens e-mail de confirmation et de mot de passe oublié échouent).
5. GitHub : dépose les fichiers dans `Hippo13bot/LA-GUEUZE`, Settings → Pages → Source : *GitHub Actions*. Le site est publié par `pages.yml` (seuls les fichiers publics sont déployés).

Sur iPhone : ouvrir l'URL dans Safari → Partager → *Sur l'écran d'accueil*.

## Sécurité
Aucune clé secrète dans le code. RLS activé sur toutes les tables `gueuze_*`. Les droits sont vérifiés côté base : seuls propriétaire/admin modifient, publient ou gèrent l'équipe ; l'équipe ne voit que les feuilles **publiées**.

## Lots 2 et 3 (migration `202611110003_gueuze_lot2_3.sql`, à exécuter après la 0002)
Lieux (liens Plans / Google Maps), annuaire, talkies, matériel (catalogue La Caverne en lecture + liste de souhaits), documents (stockage privé), import PDF assisté (texte uniquement, jamais publié sans validation), impression/export PDF, portail QR (`portal.html`, jetons à durée limitée, révocables, validés côté serveur).
**Limites connues** : pas d'OCR pour les scans ; la réservation réelle dans La Caverne n'est pas automatisée (fonction serveur de La Caverne inconnue) ; l'annuaire n'est pas encore synchronisé avec Répertoire ; builds Mac/Windows non testés ; le QR donne accès aux feuilles publiées sans connexion ; pas d'IA.
**Bureau** : onglet Actions de GitHub → « desktop » → Run workflow ; les installateurs sont dans les artefacts. Non signés : Mac demande clic droit → Ouvrir, Windows affiche SmartScreen.
