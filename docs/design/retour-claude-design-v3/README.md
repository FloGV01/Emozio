# Handoff : Emozio · palette et formes « 3a · Bandeau, tout en rondeur »

## Vue d'ensemble
L'utilisateur a rejeté les couleurs de la v12 (accent vert, fond gris et blanc, ensemble triste). Après trois palettes puis quatre
variantes, il a retenu **3a** : une base presque blanche, des surfaces teintées d'un bleu pétrole pâle, un seul accent pétrole
moyen, et des formes plus douces (en-tête d'Aujourd'hui en bandeau, rubriques à plat, pilules pour tout ce qui se touche).
Ce paquet donne les valeurs exactes à brancher dans `public/css/`.

## À propos des fichiers
`Emozio Palettes.dc.html` est une **référence de design en HTML**, pas du code à livrer. Elle rend les vrais styles de l'app
(`emozio.css` = tokens + base + composants + ecrans du dépôt, le thème porté par `.th.clair` / `.th.sombre`) avec des jetons
surchargés ; le DOM des écrans y est recopié à la main depuis `public/js/ui/`. Le travail est de **reporter ces valeurs dans
l'app existante** (modules ES natifs, Preact + htm, pas d'étape de build), sans toucher au JS ni à la structure.
La version retenue est la section du haut de la planche, **tour 3, option 3a** (classe `.th.f5` dans `variantes.css`).

## Fidélité
Haute fidélité : couleurs, rayons et marges sont définitifs. Les valeurs affichées dans les écrans sont des exemples.

## Ce qu'il faut faire
1. **`public/css/tokens.css`** : remplacer les jetons listés dans `tokens-3a.css` (clair dans `:root`, sombre dans le
   `@media (prefers-color-scheme: dark)`). Rien d'autre ne bouge : les 4 zones, les 7 familles, `--danger`, la typographie
   (sauf le grand titre), les espacements, les cibles, et le bloc `.ecran-noir` (« Réveil la nuit » reste noir, à l'encre).
2. **`public/css/composants.css` et `ecrans.css`** : fondre les règles de `formes-3a.css` dans les règles existantes des mêmes
   sélecteurs (ou les charger après `ecrans.css`).
3. **`public/index.html` et le manifest** : `theme-color` `#f8f9fa` en clair, `#080b0d` en sombre.
4. **Textes et tests à mettre à jour** : la règle « Une seule couleur d'accent, le vert (v12) » de `CLAUDE.md` (l'accent est
   désormais le pétrole ; son sens ne change pas), `docs/design/integration.md` et `docs/decisions.md` (nouvelle entrée),
   `tests/unit/jetons.test.js` et `tests/e2e/v12-design.spec.js` (valeurs de couleur, rayon des cartes, hauteur de la page du
   soir), puis `npm run precache` et `npm test`.

## Règles de sens (inchangées)
- Un seul accent : « choisi » ou « agir ». Jamais une valeur, jamais « fait ». Jamais un rond ni un point sans icône.
- Pas d'accent sur les écrans de l'émotion ni sur « Réveil la nuit » : leurs actions restent à l'encre.
- Les graphiques sont à l'encre (`--donnee*`), jamais à l'accent.
- Un choix fait garde sa coche ; un choix non fait garde son contour (`--contour`, 3:1 au moins).
- Les 4 couleurs des zones et les 7 des familles ne servent qu'aux émotions ; `--danger` à ce qui détruit.

## Jetons de couleur
| Jeton | Clair | Sombre |
|---|---|---|
| --bg | #f8f9fa | #080b0d |
| --surface | #e8f1f4 | #10252c |
| --surface-2 | #dae8ed | #19353f |
| --barre | #f1f6f8 | #0c181d |
| --line | #c3d6dd | #24434e |
| --contour | #627a83 | #6c8c97 |
| --text | #0a1c22 | #f3f8f9 |
| --text-2 | #40535a | #9fb7bf |
| --desactive | #b7c9d0 | #33505a |
| --piste | #e8f1f4 | #10252c |
| --fenetre | #ffffff | #2f5563 |
| --rond | #ffffff | #19353f |
| --accent | #2e7f99 | #62cbe8 |
| --sur-accent | #ffffff | #04161c |
| --accent-texte | #1f6c85 | #62cbe8 |
| --donnee | #3c525c | #a8bec6 |
| --donnee-1 | #bdcfd6 | #2b4751 |
| --donnee-2 | #657e87 | #7a939c |
| --donnee-3 | #1f343c | #e2edf0 |
| --fond-choix | var(--surface) | var(--surface) |
| --danger | #9e3b2f (inchangé) | #e8a195 (inchangé) |

Les jetons `--moment-*` (écrans de l'émotion) sont dans `tokens-3a.css` : l'encre et le voile y suivent la nouvelle base.

## Contrastes mesurés (WCAG)
| Paire | Clair | Sombre |
|---|---|---|
| --text sur --bg | 16,57:1 | 18,43:1 |
| --text sur --surface | 15,24:1 | 14,82:1 |
| --text-2 sur --bg | 7,65:1 | 9,40:1 |
| --text-2 sur --surface | 7,04:1 | 7,56:1 |
| --text-2 sur --surface-2 | 6,43:1 | 6,16:1 |
| --sur-accent sur --accent | 4,55:1 | 9,88:1 |
| --accent-texte sur --bg | 5,62:1 | 10,55:1 |
| --accent-texte sur --surface | 5,17:1 | 8,49:1 |
| --accent-texte sur --surface-2 | 4,73:1 | 6,92:1 |
| --accent-texte sur --barre | 5,44:1 | 9,64:1 |
| --contour sur --bg | 4,30:1 | 5,48:1 |
| --contour sur --surface | 3,96:1 | 4,41:1 |
| --contour sur --surface-2 | 3,62:1 | 3,60:1 |
| --donnee-2 sur --surface | 3,75:1 | 4,90:1 |

Point de vigilance : `--sur-accent` sur `--accent` en clair est juste au-dessus de 4,5:1. Ne pas éclaircir `--accent` sans
passer `--sur-accent` au foncé. `--accent-texte` est plus foncé que `--accent` en clair pour tenir 4,5:1 sur les surfaces teintées.

## Formes
- **Rayons** : cartes 24 (`--r-carte`, était 16). `--r-moyen` (12), `--r-bouton` (12), `--r-petit` (10) ne changent pas : les
  pilules sont posées par sélecteur sur ce qui se touche (`.pastille`, `.segmente button`, `.roue-choix` et sa fenêtre
  `::before`, `.btn`, `.puce-reglage select`, `.action-bande`, `.fab`), rayon 999. Les tuiles de l'Analyse gardent leur rayon.
- **Grand titre d'Aujourd'hui** : 40 / 47 en 700 (`min(2.35rem, 48px)` / `min(2.75rem, 58px)`), était 34 / 41.
- **Choix non fait** : fond `--surface` (`--fond-choix`), contour `inset 0 0 0 1px var(--contour)`, texte 400.
  **Choix fait** : aplat `--accent`, texte et coche `--sur-accent`, 600 (700 pour un chiffre). Rien ne change de taille.

## Écrans
### Aujourd'hui
- **En-tête en bandeau** (`.entete-jour`) : fond `--surface`, bord à bord et jusqu'en haut de l'écran (marges négatives : la
  zone sûre du haut, et `--marge` sur les côtés), marges intérieures `zone-haut + 10` / 16 / 18, coins du bas à 30, 8 sous lui.
- **Date** (`.sur-titre`) : capsule `--bg`, marges 5 × 12, rayon 999, capitales 13/600, `--text-2`, interlettrage .03em ; 6 entre
  elle et le grand titre. ‹ › : ronds `--rond`, inchangés.
- **Rubriques** (`.carte-champ`) : plus de carte. Fond nul, rayon 0, marges 14 / 0 / 8, un filet `--line` de 1 au-dessus
  (`box-shadow: 0 -1px 0`) ; la première sous le bandeau n'a pas de filet (marge du haut 6). Titre de rubrique en 700.
  Contact et Sport restent côte à côte.
- **Roues** : piste `--piste` (= `--surface`), fenêtre `--fenetre` vide, `--accent` notée ; piste et fenêtre en pilule.
- Bande du bas et onglets : inchangés hors couleurs (`--barre`, onglet actif en `--accent-texte`, icône pleine) ; les boutons de
  la bande en pilule.

### Moment difficile
- **Exercices courts** (`.exercice-court`) : pilules, fond `--surface`, contour `--contour`, grille 2 × 2 inchangée.
- **Respiration** (`.carte-respiration`) : bandeau `--surface` bord à bord (marges latérales négatives de `--marge`), rayon 34,
  marges 18 × 32 ; 10 entre ses éléments ; cercle de 176. « Commencer » : pilule d'accent, sur toute la largeur.
- **« Une chose à la fois »** et **« Mon plan »** : sans fond, contour `--line` de 1, rayon 24.

### Autres écrans (Émotion, Épisode, Analyse, et tous ceux qui ne sont pas dessinés)
Aucune règle de forme propre : ils prennent les jetons, le rayon de carte de 24 et les pilules. Les cartes y restent
(`.carte`, fond `--surface`). Les bulles de l'émotion et leur texte noir ne changent pas.

## Interactions et comportement
Rien ne change : mêmes touchers, mêmes écritures, mêmes animations (150 à 200 ms, coupées avec « Réduire les animations »).
La page du soir grandit un peu (grand titre et bandeau) : à mesurer dans WebKit à 390 × 844, et en très grand texte (‹ › doivent
passer à la ligne comme aujourd'hui ; la capsule de la date doit pouvoir passer sur deux lignes).

## À vérifier à l'intégration
- `--fond-choix: var(--surface)` : sur une carte (`--surface`), un choix non fait a la couleur de la carte, seul son contour le
  détache ; c'est voulu. `.ecran-noir` garde `transparent`.
- « Congé / repos » passe sur deux lignes dans une pilule de 44 : vérifier à 390 et à 375.
- Le contrôle global de contraste (e2e) sur tous les écrans, en clair et en sombre, jusqu'à 53 px de texte.
- Le bandeau avec « ‹ Retour » (jour ouvert depuis l'Historique) et avec le bandeau « Nouvelle version prête ».

## Fichiers
- `tokens-3a.css` : les jetons à reporter dans `public/css/tokens.css`.
- `formes-3a.css` : les règles de forme, avec les sélecteurs de l'app.
- `Emozio Palettes.dc.html`, `emozio.css`, `variantes.css`, `support.js` : la planche de référence (tour 3, 3a).
