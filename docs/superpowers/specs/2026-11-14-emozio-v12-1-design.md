# Emozio v12.1 : le design « 3a » (bleu pétrole, bandeau, pilules), deux retouches

Spécification courte, écrite le 14/11/2026 d'après le retour de Claude Design (`docs/design/retour-claude-design-v3/`) et les réponses de l'utilisateur. Elle s'ajoute à `docs/superpowers/specs/2026-11-09-emozio-v12-design.md`, dont les règles valent encore.

## 1. Pourquoi

L'utilisateur rejette les couleurs de la v12 : l'accent vert, le fond gris et blanc, un ensemble triste. Il a demandé trois palettes à Claude Design, puis a retenu **3a · « Bandeau, tout en rondeur »** : base presque blanche, surfaces teintées d'un bleu pétrole pâle, un seul accent pétrole, formes plus douces. Deux retouches s'y ajoutent.

Il veut toujours : simple, épuré, rapide à utiliser, avec une unité de couleur façon apps d'Apple. Pas de couleurs chaudes décoratives, pas de décor chargé.

## 2. Les décisions de l'utilisateur (14/11, ne se rediscutent pas)

1. **Tout 3a**, y compris ses changements de structure : en-tête d'Aujourd'hui en bandeau teinté, rubriques à plat séparées d'un filet (plus de cartes), pilules pour tout ce qui se touche, grand titre plus gros. Un seul vrai changement de structure, décidé et accepté ; aucun autre n'est permis sans son accord.
2. **Sous « Aujourd'hui », la ligne du jour disparaît** : les points de couleur des zones, le résumé de la journée (« Bureau · nuit moyen · 7 h 30 … ») et « Enregistré ». Gardés : « Encore jeudi jusqu'à 4 h. » avant 4 h (`veille`), et le message d'échec d'écriture (on ne perd jamais une saisie sans le savoir). « Enregistré » reste annoncé aux lecteurs d'écran (région `role="status"`, masquée à l'écran), puisqu'il n'y a plus de retour visuel.
3. **Carte des émotions** : le mot choisi reste un **disque agrandi** (une bulle ronde, plus grosse que ses voisines, son libellé dessus). Plus de « double capsule » (la forme à deux demi-disques de 156 pt qui devient un rectangle arrondi). La lentille (voisines à 120 puis 108 pt) et le centrage sur le mot choisi restent.
4. **Tout dans la v12.1** : elle se construit sur la v12.0.1 (déjà sur `dev`, non publiée). Publier seulement avec l'accord explicite de l'utilisateur.

## 3. Ce qui change

### 3.1 Les jetons et les formes
- `docs/design/retour-claude-design-v3/README.md` donne le détail ; `tokens-3a.css` les jetons (clair dans `:root`, sombre dans `@media (prefers-color-scheme: dark)`) ; `formes-3a.css` les règles de forme, avec les sélecteurs de l'app. **Les valeurs sont définitives** : les reporter à l'identique.
- Reporter les jetons dans `public/css/tokens.css`, fondre les règles de forme dans `composants.css` et `ecrans.css` (dans les règles existantes des mêmes sélecteurs, ou à la suite d'`ecrans.css`).
- `public/index.html` et le manifest : `theme-color` `#f8f9fa` en clair, `#080b0d` en sombre.
- **Inchangés** : les 4 zones, les 7 familles, `--danger`, la typographie (sauf le grand titre), les espacements, les cibles (44 pt au moins), `.ecran-noir` (« Réveil la nuit » reste noir, à l'encre).
- Le vert (#1c7d36 et #30d158) ne doit plus apparaître nulle part dans `public/`, sauf comme couleur de la zone « vert » ou de la famille Joie.

### 3.2 Les règles de sens (inchangées, avec l'accent pétrole)
- Un seul accent : « choisi » ou « agir ». Jamais une valeur, jamais « fait ». Jamais un rond ni un point sans icône.
- Pas d'accent sur les écrans de l'émotion ni sur « Réveil la nuit ».
- Les graphiques sont à l'encre (`--donnee*`), jamais à l'accent.
- Un choix fait garde sa coche ; un choix non fait garde son contour (`--contour`, 3:1 au moins).
- Les couleurs des zones et des familles ne servent qu'aux émotions (les familles : l'Analyse et Réglages › Émotions) ; `--danger` à ce qui détruit.

### 3.3 La ligne du jour et le mot choisi
Voir §2, points 2 et 3. Pour le mot choisi : un disque agrandi, identique en clair et en sombre, même rendu avec « Réduire les animations », libellé lisible (texte noir sur la bulle, comme aujourd'hui), cible tactile et nom accessible inchangés (`aria-pressed`).

## 4. Ce qui ne change pas
Toutes les règles de `CLAUDE.md` et de la spec v12, sauf celles que cette spec nomme : la ligne « Une seule couleur d'accent, le vert (v12) » de `CLAUDE.md` devient « le bleu pétrole » (son sens ne change pas, et l'utilisateur la gardait le 13/11) ; la valeur du vert dans `docs/` et dans les commentaires suit.

## 5. À mesurer et à tester
- **Page du soir** à 390 × 844, texte par défaut, en clair et en sombre : la hauteur avec le bandeau, le grand titre plus gros et sans la ligne du jour. Le budget de la spec v12 §5.4 (+120 px au plus sur la v11, soit 1611 px fermé et 1915 px avec « Sport en détail » ouvert) vaut toujours : si la v12.1 le dépasse, le dire dans les réserves, sans desserrer le test en silence.
- **Contrastes** (WCAG AA : texte 4,5:1, texte large et icônes 3:1, contour des choix 3:1) recalculés depuis les jetons, en clair et en sombre : les valeurs du README sont à retrouver (`--sur-accent` sur `--accent` en clair : 4,55:1, très juste ; ne pas éclaircir `--accent`).
- Le **contrôle global** (v7-controle) : débordement de côté et contraste sur tout le parcours, clair et sombre, du texte par défaut à 53 px.
- « Congé / repos » sur deux lignes dans une pilule de 44, à 390 et à 375 px.
- Le bandeau avec « ‹ Retour » (jour ouvert depuis l'Historique) et avec le bandeau « Nouvelle version prête ».
- Très grand texte : ‹ › passent à la ligne comme aujourd'hui, la capsule de la date peut passer sur deux lignes.
- Tests à mettre à jour : `tests/unit/jetons.test.js`, `tests/e2e/v12-design.spec.js`, les tests de la carte des émotions (double capsule), ceux du résumé et de « Enregistré » sous le titre, `tests/unit/v12-documentation.test.js`.

## 6. Documentation
`CLAUDE.md` (la ligne de l'accent), `docs/design/integration.md`, `docs/decisions.md` (entrée « 2026-11-14 : v12.1.0 » : les décisions du §2, les jetons 3a, ce qui disparaît), `docs/recette-iphone.md` (la recette de la v12.1 : couleurs en clair et en sombre, bandeau, page du soir, mot choisi, plus de ligne du jour). Version `12.1.0` dans `package.json`, puis `npm run precache`.

## 7. Hors de la v12.1
Pas de nouvelle fonction ni de nouvel écran ; pas d'autre changement de structure ; le défaut du très grand texte d'En consultation (barres à 0 px, point `HERITES`) reste ouvert.
