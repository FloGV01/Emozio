# Emozio · les couleurs, nouvelle série de propositions (prompt pour Claude Design, novembre 2026)

> À coller tel quel dans Claude Design, avec les captures du dossier `docs/design/v12-captures/` en pièces jointes (10 écrans actuels, en clair et en sombre).

## 0. La demande en deux phrases

L'utilisateur n'aime pas du tout les couleurs de la version actuelle (v12). Propose-lui **trois palettes très différentes les unes des autres**, appliquées aux **mêmes écrans**, en clair et en sombre, pour qu'il choisisse sur image. Tout doit rester **simple, épuré et rapide à utiliser**.

**Tu t'arrêtes après les trois propositions.** Ne décline rien d'autre avant son choix.

## 1. Le produit, en bref

- **Emozio** : une app personnelle de suivi du quotidien (humeur, émotions, sommeil, traitement, rendez-vous), pour un seul utilisateur, sur iPhone. C'est une app web installée sur l'écran d'accueil, sans compte, qui marche hors ligne.
- **Les usages, du plus fréquent au plus rare** : noter une émotion du moment (1 à 3 touchers), la saisie du soir en moins de 30 s, un épisode émotionnel, le Moment difficile (respiration, une chose à la fois), relire ses graphiques, préparer un rendez-vous.
- **Le soir, l'iPhone est en mode sombre.** Le sombre est donc un thème principal, pas une variante.
- **Ce que l'app ne fait pas** : elle ne conseille pas, ne juge pas, ne félicite pas, n'alerte pas.

## 2. Ce qui ne va pas aujourd'hui (le retour de l'utilisateur)

Dans la v12 (captures jointes), il rejette trois choses :
1. **Le vert d'accent.** Un vert profond en clair (#1C7D36) et un vert vif en sombre (#30D158) portent les boutons, les coches, les liens et les choix faits.
2. **Le fond gris et blanc.** Une base neutre façon iOS : fond gris très pâle (#F2F2F7), cartes blanches, et en sombre fond noir avec cartes gris foncé.
3. **L'ensemble, qui est triste.** Pas une couleur en particulier : le résultat manque de vie.

Ce qu'il avait dit avant, et qui reste vrai :
- il est **très visuel** : un peu de couleur est possible, mais il veut **une unité**, comme dans les apps d'Apple, Uber ou l'App Store ;
- ce qui l'avait gêné en v11 : **trop de couleurs** sans cohérence entre elles ;
- il a refusé en bloc les couleurs chaudes et les décors chargés (ciel, bulles, cadrans, serif éditorial, autocollants). **N'y reviens pas.**

La difficulté est donc celle-ci : **plus de vie qu'en v12, sans retomber dans le trop-plein de la v11.**

## 3. Ce qui ne change pas (non négociable)

**Structure**
- Par défaut, la structure des écrans, l'ordre des rubriques et la taille des cibles tactiles (44 pt au moins) ne changent pas : **l'habillage change** (couleurs, fonds, contrastes, formes douces, rayons, ombres, filets).
- **Une petite modification de structure est possible, mais seulement avec l'accord de l'utilisateur.** Si la structure t'empêche de réussir une proposition, ne la change pas dans la proposition : décris-la à part, dans une section « Modifications de structure proposées », avec pour chacune :
  - ce qui change (par exemple l'espacement, le regroupement de deux rubriques, la forme d'une carte, la place d'un bouton) ;
  - pourquoi la palette en a besoin ;
  - une image « avant / après » du même écran ;
  - l'effet sur la saisie du soir (elle doit rester en moins de 30 s, et un toucher enregistre toujours).
  Il dira oui ou non à chacune. Sans son oui, ne l'applique à aucune des trois palettes. Les petites : pas de nouvelle fonction, pas de nouvel écran, pas de rubrique retirée, et jamais de cible tactile sous 44 pt.
- Police : celle du système (SF sur iPhone). Rien à télécharger.
- Clair **et** sombre, qui suivent le réglage de l'iPhone.

**Les 4 couleurs des zones de la carte des émotions**
- Rouge, jaune, bleu, vert : l'utilisateur les aime. **Garde-les telles quelles** (valeurs ci-dessous). Elles ne servent qu'aux émotions.
- Les 7 couleurs des familles d'émotions ne servent que dans l'Analyse et Réglages › Émotions.
- Ta palette doit donc **cohabiter** avec ces 4 couleurs sans les concurrencer. En particulier, ton accent ne doit pas être confondu avec le vert de la zone « énergie basse agréable », ni avec le rouge de la zone.

| Zone | Clair | Sombre |
|---|---|---|
| Rouge | #E53029 (fond de choix #FE4C40) | #FE4C40 |
| Jaune | #9E7B00 (fond de choix #FFD04C) | #FFD04C |
| Bleu | #577BD7 (fond de choix #789FFF) | #789FFF |
| Vert | #009860 (fond de choix #4CE39B) | #4CE39B |

**Règles de sens des couleurs**
- Une seule couleur d'accent. Elle veut dire « choisi » ou « agir ». **Jamais** une valeur, jamais « fait », « réussi », « bien » ou « mal ».
- Jamais de rouge ni de vert pour dire bon ou mauvais, hors des émotions. `--danger` (rouge) ne sert qu'à ce qui détruit, comme « Tout effacer ».
- La couleur n'est jamais seule : un choix fait garde sa **coche** et son contour.
- Aucune mécanique d'engagement : ni série, ni score, ni badge, ni félicitation, ni barre de progression, ni compteur de jours. Aucune couleur ne doit ressembler à un résultat.
- Les rubriques du soir n'ont **pas de couleur à elles** (décision v12) : ne rends pas une couleur à chaque rubrique.

**Accessibilité**
- Texte : 4,5:1 au moins (AA) sur son fond, sur les cartes et sur les fonds teintés. Texte large et icônes : 3:1.
- Contours des choix non faits : 3:1 au moins sur le fond.
- Teste aussi à très grand texte (Dynamic Type) : rien ne doit reposer sur une couleur seule.

## 4. Les trois propositions

Elles doivent être **vraiment différentes** : pas trois nuances de la même idée. Pour chacune, donne-lui un nom de deux mots, une phrase qui dit l'idée, et la palette complète. Voici les pistes de départ, à reformuler librement :

- **A · Base chaude et douce, accent unique.** Un fond légèrement teinté (pas gris), des cartes qui s'en détachent, un accent franc et un seul. Le plus proche de l'esprit « Apple ».
- **B · Base sobre, la couleur dans les surfaces.** Fond neutre, mais des cartes et des bandeaux teintés d'une même famille de tons, pour donner de la vie sans multiplier les couleurs.
- **C · Contraste net, presque monochrome.** Un fond très clair (ou très sombre), de l'encre profonde, et un accent vif réservé à l'action. La vie vient du contraste et de la typographie, pas de la teinte.

Tu peux les remplacer si tu as de meilleures idées, tant qu'elles restent **simples et épurées**. Écarte toute proposition qui demande de l'explication pour être comprise.

**Pour chaque proposition, fournis :**
1. La palette en jetons nommés, **en clair et en sombre**, avec ces rôles (les noms sont ceux du code) :

| Jeton | Rôle |
|---|---|
| `--bg` | fond de l'écran |
| `--surface` | cartes |
| `--surface-2` | remplissage discret (jamais un choix) |
| `--barre` | bande du bas et onglets |
| `--line` | filets décoratifs |
| `--contour` | contour d'un choix non fait (3:1 au moins) |
| `--text` / `--text-2` | texte principal / secondaire |
| `--accent` | aplat d'un choix fait ou d'une action |
| `--sur-accent` | texte et coche posés sur l'accent |
| `--accent-texte` | texte d'un lien ou d'une icône qui ouvre quelque chose |
| `--donnee`, `--donnee-1` à `-3` | l'encre des graphiques (rampe à 3 pas) |
| `--danger` | ce qui détruit |

2. Les **rapports de contraste** mesurés : texte sur fond, texte sur carte, `--sur-accent` sur `--accent`, `--accent-texte` sur fond et carte, contour sur fond. En clair et en sombre.
3. Les **mêmes 5 écrans**, en clair et en sombre, au format iPhone 390 × 844 :
   - Aujourd'hui, rempli (en-tête et premières rubriques) ;
   - l'écran Émotion (la carte des mots) ;
   - Épisode, étape Intensité ;
   - Analyse, haut de l'écran ;
   - Moment difficile.
4. Une phrase sur **ce qu'on gagne et ce qu'on perd** par rapport à la v12.
5. Si besoin, la section « Modifications de structure proposées » (§3), séparée des palettes, que l'utilisateur acceptera ou non.

## 5. Ce que l'utilisateur regardera

- Il choisit **sur image**, donc mets les trois propositions **côte à côte sur une planche**, avec le clair au-dessus et le sombre en dessous.
- Il veut voir la **vie** de l'écran dès le premier coup d'œil, sans qu'il soit chargé.
- Il juge à l'usage : trouver et toucher un choix sans lire. Si une proposition ressemble à un tableau de bord ou à un jeu, elle est écartée.

## 6. Ce que tu ne fais pas

- Pas de refonte de la mise en page, pas de nouvelles fonctions, pas de nouveaux écrans. Une modification de structure ne passe que par la section « Modifications de structure proposées » du §3, et seulement avec l'accord de l'utilisateur.
- Pas de couleurs chaudes décoratives (ciel, soleil, dégradés orangés), pas de dégradés, pas de textures.
- Pas d'illustrations ni de mascotte. Pas d'emoji.
- Pas de texte nouveau : les libellés restent ceux des captures.
- Pas de données réelles dans les maquettes : les valeurs sont celles des captures.

## 7. Pour la suite (après son choix, pas avant)

Quand il aura choisi, il te demandera la déclinaison complète : les jetons ci-dessus prêts à coller dans `tokens.css` (valeurs exactes, clair et sombre, contrastes vérifiés), puis les écrans restants. Garde ta palette sous forme de jetons nommés, c'est ce qui permettra de la brancher sans retoucher les écrans.
