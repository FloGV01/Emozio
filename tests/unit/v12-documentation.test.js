import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { RACINE, lire } from '../aides/fichiers.js';
import { jetons, contraste } from '../aides/couleurs.js';

// v12 (9/9) · Ce que la v12 laisse écrit (plan v12, tâche 9 ; spec §8) : la règle « Zéro réseau » de CLAUDE.md et son exception
// étendue, le jeton jamais écrit, la ligne de l'accent ; l'entrée v12.0.0 de docs/decisions.md et ses règles levées, annotées
// dans leurs entrées d'origine ; les deux journaux de version ; la recette de l'iPhone. v12.0.1 (13/11) : son entrée, ses deux
// réponses à ce que la relecture finale laissait en attente, et la version 12.0.1. v12.1 (14/11, spec 2026-11-14 §4 et §6,
// tâche C) : la ligne de l'accent de CLAUDE.md passe au bleu pétrole, sans rien perdre de son sens ; l'entrée v12.1.0 (les
// quatre décisions du §2, les jetons 3a et leurs contrastes, ce qui disparaît, ce qui attend l'utilisateur) ; la section
// v12.1 de integration.md, du journal de version et de la recette ; la version 12.1.0.
const doc = (...p) => lire(join(RACINE, ...p));
const entrees = () => doc('docs', 'decisions.md').split(/^(?=## )/m);
const entreeV12 = () => entrees().find((e) => e.startsWith('## 2026-11-09 : v12.0.0'));
// v12.0.1 (13/11) : ses réponses aux deux points de la relecture finale laissés en attente.
const TITRE_V1201 = '## 2026-11-13 : v12.0.1, les barres « Émotions » d\'En consultation à l\'encre des données';
const entreeV1201 = () => entrees().find((e) => e.startsWith(`${TITRE_V1201}\n`));
// v12.1.0 (14/11) : la palette 3a, la ligne du jour et le mot choisi.
const TITRE_V121 = '## 2026-11-14 : v12.1.0, la palette « 3a » : le bleu pétrole, le bandeau et les pilules';
const entreeV121 = () => entrees().find((e) => e.startsWith(`${TITRE_V121}\n`));
// La ligne de l'accent de CLAUDE.md : le vert en v12, le bleu pétrole depuis la v12.1 (spec v12.1 §4).
const DEBUT_ACCENT = '- **Une seule couleur d\'accent, le bleu pétrole (v12.1).**';
const ligneAccent = () => doc('CLAUDE.md').split('\n').find((l) => l.startsWith(DEBUT_ACCENT));
const section = (entree, titre) => {
  const i = entree.indexOf(`### ${titre}\n`);
  assert.ok(i > 0, `${titre} absent`);
  return entree.slice(i).split('\n### ')[0];
};

test('CLAUDE.md : « Zéro réseau » dit « Mettre à jour la liste », les morceaux et le jeton jamais écrit ; une ligne dit l\'accent (bleu pétrole depuis la v12.1) et les couleurs des émotions', () => {
  const lignes = doc('CLAUDE.md').split('\n');
  const regle = lignes.find((l) => l.startsWith('- **Zéro réseau, zéro CDN.**'));
  assert.ok(regle, 'règle « Zéro réseau » absente de CLAUDE.md');
  for (const x of ['seule exception', '« Choisir dans mon compte »', '« Changer de playlist »', '« Mettre à jour la liste »', 'dans Mes refuges',
    'jamais à l\'ouverture ni dans Moment difficile', '`v1/playlists/{id}/items`', 'aucun jeton n\'est gardé',
    'jamais écrit ; en mémoire le temps de choisir une playlist, 10 min au plus', '`connect-src`', '`https://accounts.spotify.com`', '`https://api.spotify.com`']) {
    assert.ok(regle.includes(x), `CLAUDE.md, zéro réseau : ${x}`);
  }
  // L'accent, en une ligne, juste avant « Zéro réseau ».
  const i = lignes.indexOf(regle);
  const accent = lignes[i - 1];
  assert.ok(accent.startsWith(DEBUT_ACCENT), accent);
  assert.doesNotMatch(accent, /\bvert\b/, 'CLAUDE.md, accent : plus de vert');
  for (const x of ['« choisi » ou « agir », jamais une valeur', 'jamais un rond ni un point', 'écrans de l\'émotion', 'graphiques', '« Réveil la nuit »', 'coche',
    '4 zones', '7 familles', 'réservées aux émotions', '`--danger`', 'les rubriques n\'ont plus de couleur']) {
    assert.ok(accent.includes(x), `CLAUDE.md, accent : ${x}`);
  }
});

test('docs/decisions.md : l\'entrée v12.0.0, la liste de la spec §8, ses écarts, le contrôle global et ce qui attend l\'utilisateur', () => {
  const v12 = entreeV12();
  assert.ok(v12, 'entrée v12.0.0 absente');
  // Une seule entrée de version 12.0.0, juste après celle de la v11 ; celle de la v12.0.1 la suit (13/11), puis celle de la
  // v12.1.0, la dernière (14/11).
  assert.deepEqual(entrees().filter((x) => x.includes('**Version 12.0.0**')).map((x) => x.split('\n', 1)[0]), ['## 2026-11-09 : v12.0.0, la musique de Détente et un design simple']);
  const titres = entrees().map((e) => e.split('\n', 1)[0]);
  assert.equal(titres.at(-1), TITRE_V121);
  assert.equal(titres.at(-2), TITRE_V1201);
  assert.equal(titres.at(-3), '## 2026-11-09 : v12.0.0, la musique de Détente et un design simple');
  assert.equal(titres.at(-4), '## 2026-11-08 : v11.0.0, six retours après la v10');
  for (const x of ['docs/superpowers/specs/2026-11-09-emozio-v12-design.md', 'docs/superpowers/plans/2026-11-09-emozio-v12.md', '`FORMAT_VERSION` 9']) assert.ok(v12.includes(x), x);
  assert.match(v12, /`DB_VERSION` 6, confirmé/);
  // La spec §8 : les décisions du §2, les jetons, l'accent B et son sens, les graphiques, les icônes pleines (B1), la coche, les
  // écrans de l'émotion sans accent, la voie D, le format 9, la fin de la palette 2b.
  const decisions = section(v12, 'Décisions de l\'utilisateur (spec §2, 08 et 09/11)');
  for (const x of ['« Oui, ça me va »', '**Premium**', '« Trop de couleurs »', '**rien n\'est replié ni caché**', '« Oui, on part là-dessus. »', '« Vert iPhone »',
    'rendu **B**', '**La confiance et l\'estime de soi : annulées.**', '11.0.1']) {
    assert.ok(decisions.includes(x), `décisions : ${x}`);
  }
  const jetons = section(v12, 'Les jetons (spec §5.2 et §5.3, tâche 3)');
  for (const x of ['`--barre`', '`--contour`', '`--desactive`', '`--piste`', '`--fenetre`', '`--donnee`', '`--accent`, `--sur-accent`, `--accent-texte`', '#F2F2F7']) {
    assert.ok(jetons.includes(x), `jetons : ${x}`);
  }
  const accent = section(v12, 'L\'accent B et sa règle de sens (spec §5.3)');
  for (const x of ['#1C7D36', '#30D158', '« choisi » ou « agir », jamais une valeur', 'jamais un rond ni un point', '`--surface-2`',
    '**Les écrans de l\'émotion (`.moment-plein`) n\'ont pas d\'accent**', '« Réveil la nuit »']) {
    assert.ok(accent.includes(x), `accent : ${x}`);
  }
  assert.match(section(v12, 'La règle des graphiques (spec §5.5, tâche 5)'), /L'accent n'entre jamais dans un graphique/);
  const levees = section(v12, 'Règles levées ou changées');
  for (const x of ['**La palette 2b prend fin**', '**B1 · Icônes**', '**la coche gardée**', '« Jamais de rouge ni de vert pour dire bien ou mal »', '**`--danger`**']) {
    assert.ok(levees.includes(x), `règles levées : ${x}`);
  }
  const jeton = section(v12, 'La voie D du jeton (spec §6.4, tâches 2 et 6)');
  for (const x of ['`lireMorceaux(id)`', '**une fois**', '**10 minutes**', '**Le jeton n\'est jamais écrit**', '**Rien n\'est écrit avant la réponse des morceaux.**', '« Annuler »']) {
    assert.ok(jeton.includes(x), `voie D : ${x}`);
  }
  assert.match(section(v12, 'Le format 9 (tâche 1)'), /`MISES_A_NIVEAU\[8\]` ne transforme rien/);
  const controle = section(v12, 'Contrôle global (tâche 9)');
  for (const x of ['99 écrans', '33, 40, 47 et 53 px', '`HERITES`', 'la v12 n\'en ajoute aucun', '« Mouvement »', '**Le second correctif**', 'l\'empreinte de la version',
    '**Aucune trace des 12 couleurs de rubrique**',
    '**Version 12.0.0**', '`node scripts/temoins.mjs --verifier`']) {
    assert.ok(controle.includes(x), `contrôle global : ${x}`);
  }
  // Les 30 s du soir, la règle qui prime sur tout, ne sont chronométrées par aucun test : seule la hauteur est mesurée. L'entrée
  // ne les donne pas pour acquises et renvoie à la recette, qui demande trois soirs en moins de 30 s (relecture de la tâche 9).
  const cartes = section(v12, 'Les écrans (tâches 4 et 5)').split('\n').find((l) => l.startsWith('- **Les cartes du soir**'));
  assert.ok(cartes.includes('rien n\'a changé de place ; les 30 s restent à vérifier sur l\'iPhone (recette v12, « La page du soir »)'), cartes);
  assert.doesNotMatch(v12, /se remplit toujours en moins de 30 s/);
  assert.match(sectionV12(doc('docs', 'recette-iphone.md')), /^- \[[ xX]\] \*\*La page du soir\*\* : trois soirs, chacun en moins de 30 s\./m);
  const ecarts = section(v12, 'Écarts au texte de la spec');
  for (const x of ['`fields`', '« Ce lien peut ne rien ouvrir depuis Emozio. »', '« Coller le code de Spotify »']) assert.ok(ecarts.includes(x), `écarts : ${x}`);
  const attente = section(v12, 'En attente de l\'utilisateur');
  for (const x of ['`docs/recette-iphone.md`', 'collaboratives', 'Premium', '« Morceau dans sa playlist »', 'fermer l\'onglet puis rouvrir l\'adresse', '**Hors de la v12**']) {
    assert.ok((attente + section(v12, 'À essayer sur l\'iPhone')).includes(x), `en attente : ${x}`);
  }
  const textes = section(v12, 'Textes nouveaux à relire après la publication');
  for (const x of ['« Un toucher ouvre Spotify. »', '« La suite est dans Spotify. »', '« Choisis ta playlist dans ton compte Spotify, ou colle son lien. »', '« Coller un lien »',
    '« Changer de playlist »', '« Mettre à jour la liste »', '« Ouvrir un morceau »', '« Morceau seul »', '« Morceau dans sa playlist »',
    'Ta liste reste.', 'Dans Safari, ferme l\'onglet d\'Emozio s\'il est ouvert, puis rouvre l\'adresse : la page se met à jour.']) {
    assert.ok(textes.includes(x), `textes : ${x}`);
  }
});

// La règle de forme (spec §5.3) a son exception : un bouton rond qui porte une icône peut porter l'accent, et le ▶ du lecteur
// (.bouton-lecture) est un disque à l'accent. Partout où la règle est écrite pour être suivie, l'exception la suit de près :
// sinon une session qui lit « jamais un rond ni un point » retirerait l'accent du ▶ (relecture de la tâche 9).
test('« jamais un rond ni un point » dit son exception, le bouton rond qui porte une icône, partout où la règle est écrite', () => {
  const lieux = {
    'CLAUDE.md': doc('CLAUDE.md'),
    'docs/decisions.md, entrée v12.0.0': entreeV12(),
    'docs/decisions.md, entrée v12.1.0': entreeV121(),
    'docs/design/integration.md': doc('docs', 'design', 'integration.md'),
    'public/css/tokens.css': doc('public', 'css', 'tokens.css'),
  };
  for (const [nom, texte] of Object.entries(lieux)) {
    const plat = texte.replace(/\s+/g, ' ');
    const occurrences = [...plat.matchAll(/jamais un rond ni un point/gi)];
    assert.ok(occurrences.length > 0, `${nom} : la règle de forme absente`);
    for (const o of occurrences) {
      const suite = plat.slice(o.index, o.index + 300);
      assert.ok(suite.includes('bouton rond qui porte une icône'), `${nom} : la règle sans son exception, « ${suite} »`);
    }
  }
  const claude = ligneAccent();
  assert.ok(claude.includes('jamais un rond ni un point sans icône (seul un bouton rond qui porte une icône, comme le ▶ du lecteur, peut le porter)'), claude);
});

test('docs/decisions.md : les règles levées par la v12 sont annotées dans leurs entrées d\'origine (v7)', () => {
  const v7 = entrees().find((e) => e.startsWith('## 2026-10-22 : v7.0.0'));
  assert.ok(v7);
  const ligne = (debut) => v7.split('\n').find((l) => l.startsWith(debut));
  for (const debut of ['- **Apparence** : piste 2b', '- **B1 · Icônes**', '- **B5 · Couleurs**']) {
    assert.match(ligne(debut), /Levé en v12 : .*\(voir l'entrée v12\.0\.0, « Règles levées ou changées »\)\.$/, debut);
  }
  assert.match(ligne('- Piste 2b, police système'), /levé en v12 pour la couleur/);
  assert.match(ligne('- **Règle levée à sa demande**'), /Toujours vrai en v12/);
  assert.match(ligne('- **« Effacer définitivement » en rouge**'), /En v12, il reste rouge/);
});

test('les journaux de version ont leur section v12, qui renvoie à sa spécification et à docs/decisions.md, et dit la fin de la palette 2b', () => {
  const spec = doc('docs', 'v6-specification.md');
  const i = spec.indexOf('## 20. v12 (09/11)');
  assert.ok(i > 0, 'section v12 absente de docs/v6-specification.md');
  const v12 = spec.slice(i);
  for (const x of ['docs/superpowers/specs/2026-11-09-emozio-v12-design.md', 'docs/decisions.md', 'la palette 2b prend fin', '`v1/playlists/{id}/items`', 'format 9']) {
    assert.ok(v12.includes(x), x);
  }
  const design = doc('docs', 'design', 'integration.md');
  const titre = design.match(/^## v12 : .*\(09\/11\)$/m);
  assert.ok(titre, 'section v12 absente de docs/design/integration.md');
  const v12d = design.slice(titre.index);
  for (const x of ['docs/superpowers/specs/2026-11-09-emozio-v12-design.md', 'docs/decisions.md', '**La palette 2b prend fin**', '#1C7D36', '#30D158', '**la coche gardée**',
    '**La maquette est en violet**']) {
    assert.ok(v12d.includes(x), x);
  }
  // La palette des rubriques, dite plus haut pour la J2.0, dit jusqu'à quand.
  assert.match(design.slice(0, titre.index), /Levé en v12 : une base neutre/);
});

// La recette se coche à chaque jalon : la section v12 s'arrête à l'en-tête suivant, et ses huit points (spec §8) restent huit,
// cochés ou non.
const sectionV12 = (recette) => recette.slice(recette.indexOf('## v12')).split(/\n(?=## )/)[0];

test('docs/recette-iphone.md, « v12 » : les huit points de la spec §8, et leur compte tient quand l\'utilisateur en coche un', () => {
  const recette = doc('docs', 'recette-iphone.md');
  assert.ok(recette.includes('\n## v12\n'));
  const v12 = sectionV12(recette);
  for (const x of ['**Détente et un morceau ouvrent Spotify**', '**La lecture démarre-t-elle ?**', '**Ce qui joue après le morceau**', '**La forme « dans sa playlist », au Diagnostic**',
    '**« Mettre à jour la liste »**', '**Le vert, en clair et en sombre**', '**La page du soir**', '**L\'ajout à l\'écran d\'accueil depuis Safari**']) {
    assert.ok(v12.includes(x), `recette : ${x}`);
  }
  const cochee = recette.replace('- [ ] **La page du soir**', '- [x] **La page du soir**');
  const suivie = `${cochee.trimEnd()}\n\n## v13\n\n- [ ] Un point d'après.\n`;
  for (const r of [recette, cochee, suivie]) assert.equal((sectionV12(r).match(/^- \[[ xX]\] /gm) || []).length, 8);
});

// Relecture finale de la v12 : le bandeau « Nouvelle version prête » n'existe pas dans Safari (spec §7) ; la lecture de l'en-tête
// d'Aujourd'hui par VoiceOver, vérifiée dans Chromium seulement (tâche 4), est à la recette. Les lignes de CLAUDE.md écrites
// d'après le plan, et les barres « Émotions » d'En consultation aux couleurs des familles, qui attendaient sa décision, sont
// tranchées le 13/11 (v12.0.1, test suivant) : elles ne sont plus en attente.
test('relecture finale : l\'entrée v12 ne place pas le bandeau dans Safari ; ce qui attend l\'utilisateur ne dit plus les lignes de CLAUDE.md ni les barres d\'En consultation ; la recette fait lire l\'en-tête par VoiceOver', () => {
  const v12 = entreeV12();
  const decisions = section(v12, 'Décisions de l\'utilisateur (spec §2, 08 et 09/11)');
  assert.doesNotMatch(decisions, /dans Safari, il a fallu toucher « Nouvelle version prête »/);
  assert.ok(decisions.includes('Safari gardait l\'ancienne version ; il a fallu toucher « Nouvelle version prête » (le bandeau de l\'app installée, qui n\'existe pas dans Safari)'));
  const attente = section(v12, 'En attente de l\'utilisateur').split('\n');
  assert.equal(attente.find((l) => l.includes('CLAUDE.md')), undefined, 'CLAUDE.md encore en attente');
  assert.equal(attente.find((l) => /consultation/i.test(l)), undefined, 'En consultation encore en attente');
  assert.ok(attente.some((l) => l.startsWith('- **`--danger`** rouge')), '--danger, toujours à relire');
  const soir = sectionV12(doc('docs', 'recette-iphone.md')).split('\n').find((l) => /^- \[[ xX]\] \*\*La page du soir\*\*/.test(l));
  for (const x of ['Avec VoiceOver', '« Aujourd\'hui, Jeudi 15 octobre »', '« Mercredi 14 octobre »', 'sans épeler les capitales du sur-titre']) {
    assert.ok(soir.includes(x), `recette, la page du soir : ${x}`);
  }
});

// v12.0.1 (13/11) : les barres « Émotions » d'En consultation passent à l'encre des données, la règle de CLAUDE.md restant telle
// quelle ; les deux lignes de CLAUDE.md écrites d'après le plan v12 sont gardées (« oui, on garde »), et CLAUDE.md ne change pas.
test('docs/decisions.md, l\'entrée v12.0.1 : les barres d\'En consultation à l\'encre, les lignes de CLAUDE.md gardées, le contrôle des familles', () => {
  const v1201 = entreeV1201();
  assert.ok(v1201, 'entrée v12.0.1 absente');
  assert.deepEqual(entrees().filter((x) => x.includes('**Version 12.0.1**')).map((x) => x.split('\n', 1)[0]), [TITRE_V1201]);
  const decisions = section(v1201, 'Décisions de l\'utilisateur (13/11)').split('\n');
  const consultation = decisions.find((l) => l.startsWith('- **Les barres « Émotions » d\'En consultation**'));
  assert.ok(consultation, 'En consultation absent des décisions');
  for (const x of ['`#/consultation/<id>`', 'l\'encre des données (`--donnee`)', '7 couleurs des familles', 'La règle de `CLAUDE.md` reste telle quelle',
    'les agrégats de l\'Analyse et Réglages › Émotions']) {
    assert.ok(consultation.includes(x), `En consultation : ${x}`);
  }
  const claude = decisions.find((l) => l.startsWith('- **`CLAUDE.md`**'));
  assert.ok(claude, 'CLAUDE.md absent des décisions');
  for (const x of ['« oui, on garde »', '« Une seule couleur d\'accent, le vert (v12) »', '« Règles qui priment sur tout »', '« Changer de playlist »',
    '« Mettre à jour la liste »', 'd\'après le plan v12 (tâche 9)', 'validées telles quelles', '`CLAUDE.md` ne change pas']) {
    assert.ok(claude.includes(x), `CLAUDE.md : ${x}`);
  }
  const change = section(v1201, 'Ce qui change');
  for (const x of ['`BarresFamilles`', '`encre`', '`.g-barre`', 'Une seule encre', '`ECRANS_FAMILLES`', '`v7-controle.spec.js`', 'Sur le code de la v12.0.0, il échoue',
    '**Version 12.0.1**']) {
    assert.ok(change.includes(x), `ce qui change : ${x}`);
  }
  // La règle de CLAUDE.md, telle quelle : les familles réservées aux agrégats de l'Analyse et à Réglages › Émotions, sans En
  // consultation. La v12.1 n'y change que la couleur de l'accent (le bleu pétrole), dans son titre.
  const accent = ligneAccent();
  assert.ok(accent.includes('dans les agrégats de l\'Analyse et Réglages › Émotions'), accent);
  assert.doesNotMatch(accent, /consultation/i);
});

// Relecture finale : le contraste d'un lien vert sur --surface-2 en clair, calculé depuis les jetons, est celui que donnent les
// jetons, le contrôle et la documentation (la spec dit « environ 4,48 ») ; le commentaire de la carte dit son rayon, --r-carte.
// v12.1 (tâche A) : les jetons 3a le portent à 4,73:1 (le lien, --accent-texte, plus foncé que l'accent) ; les jetons, le
// contrôle et l'entrée v12.1.0 (tâche C) disent la valeur d'aujourd'hui, l'entrée v12.0.0 et la section v12 de integration.md
// gardent celle de la v12, 4,49:1.
test('le lien sur --surface-2 en clair : 4,73:1 (v12.1), calculé depuis les jetons, écrit dans les jetons et le contrôle ; 4,49:1 (v12) reste dans l\'histoire de la v12 ; le commentaire de la carte dit le rayon de --r-carte', () => {
  const css = doc('public', 'css', 'tokens.css');
  const { clair } = jetons(css);
  const ecrit = `${contraste(clair['accent-texte'], clair['surface-2']).toFixed(2).replace('.', ',')}:1`;
  assert.equal(ecrit, '4,73:1');
  const lieux = {
    'public/css/tokens.css': css,
    'tests/aides/controle.js': doc('tests', 'aides', 'controle.js'),
    'docs/decisions.md, entrée v12.1.0': entreeV121(),
  };
  for (const [nom, texte] of Object.entries(lieux)) {
    const plat = texte.replace(/\s+/g, ' ');
    assert.ok(plat.includes(ecrit), `${nom} : ${ecrit} absent`);
    assert.doesNotMatch(plat, /4,48:1/, nom);
  }
  const histoire = {
    'docs/decisions.md, entrée v12.0.0': entreeV12(),
    'docs/design/integration.md': doc('docs', 'design', 'integration.md'),
  };
  for (const [nom, texte] of Object.entries(histoire)) {
    const plat = texte.replace(/\s+/g, ' ');
    assert.ok(plat.includes('4,49:1'), `${nom} : 4,49:1 absent`);
    assert.doesNotMatch(plat, /4,48:1/, nom);
  }
  const rayon = /--r-carte:\s*(\d+)px;/.exec(css)[1];
  assert.equal(rayon, '24');
  assert.ok(doc('public', 'css', 'composants.css').includes(`/* Carte : --surface sans bordure, rayon ${rayon} (--r-carte) ;`));
});

// v12.1 (14/11, spec 2026-11-14 §2, §4 et §6 ; tâche C) : l'entrée v12.1.0, la dernière. Ses jetons et ses contrastes sont
// recalculés ici depuis tokens.css : chaque valeur écrite est celle des jetons (et celle du README de Claude Design, que
// jetons.test.js compare aux jetons). La page du soir mesurée ne se donne pas pour chronométrée : les 30 s sont à la recette.
const deux = (n) => n.toFixed(2).replace('.', ',');
test('docs/decisions.md, l\'entrée v12.1.0 : les quatre décisions du §2, les jetons 3a et leurs contrastes recalculés, ce qui disparaît, les écarts, ce qui attend l\'utilisateur', () => {
  const v121 = entreeV121();
  assert.ok(v121, 'entrée v12.1.0 absente');
  assert.deepEqual(entrees().filter((x) => x.includes('**Version 12.1.0**')).map((x) => x.split('\n', 1)[0]), [TITRE_V121]);
  for (const x of ['docs/superpowers/specs/2026-11-14-emozio-v12-1-design.md', 'docs/design/retour-claude-design-v3/', '`FORMAT_VERSION` 9', '`DB_VERSION` 6',
    'construite sur la v12.0.1', 'avec l\'accord explicite de l\'utilisateur']) {
    assert.ok(v121.includes(x), x);
  }
  // Les quatre décisions du §2, dans l'ordre de la spec.
  const decisions = section(v121, 'Décisions de l\'utilisateur (spec §2, 14/11)').split('\n').filter((l) => l.startsWith('- '));
  assert.equal(decisions.length, 4);
  [
    ['**Tout 3a**', 'bandeau teinté', 'à plat séparées d\'un filet', 'des pilules pour tout ce qui se touche', 'un grand titre plus gros', 'aucun autre sans son accord'],
    ['**Sous « Aujourd\'hui », la ligne du jour disparaît**', 'les points de couleur des zones', 'le résumé de la journée', '« Enregistré »',
      '« Encore jeudi jusqu\'à 4 h. »', 'le message d\'échec d\'écriture', '`role="status"`', 'masquée à l\'écran'],
    ['**Carte des émotions**', '**disque agrandi**', 'Plus de « double capsule »', 'La lentille', '120 puis 108', 'le centrage sur le mot choisi restent'],
    ['**Tout dans la v12.1**', 'v12.0.1', 'accord explicite'],
  ].forEach((mots, i) => { for (const x of mots) assert.ok(decisions[i].includes(x), `décision ${i + 1} : ${x}`); });
  // Les jetons 3a : chaque valeur de tokens.css, en clair puis en sombre.
  const { clair, sombre } = jetons(doc('public', 'css', 'tokens.css'));
  const jet = section(v121, 'Les jetons 3a (spec §3.1, tâche A)');
  for (const n of ['bg', 'surface', 'surface-2', 'barre', 'line', 'contour', 'text', 'text-2', 'desactive', 'piste', 'fenetre', 'rond', 'accent', 'sur-accent',
    'accent-texte', 'donnee', 'donnee-1', 'donnee-2', 'donnee-3']) {
    assert.ok(jet.includes(`\`--${n}\` ${clair[n]} / ${sombre[n]}`), `jetons : --${n} ${clair[n]} / ${sombre[n]}`);
  }
  for (const x of ['`--fond-choix`** vaut `--surface`', '`--r-carte` 24', '40/47 en 700', '#f8f9fa en clair, #080b0d en sombre', '`FOND_CARTE_DU_BAS`', '`.ecran-noir`']) {
    assert.ok(jet.includes(x), `jetons : ${x}`);
  }
  // Les contrastes, recalculés (WCAG) : « clair / sombre », chacun tel que les jetons le donnent.
  const contrastes = jet.slice(jet.indexOf('**Les contrastes**')).replaceAll('**', '');
  const paire = (a, b) => `${deux(contraste(clair[a], clair[b]))}:1 / ${deux(contraste(sombre[a], sombre[b]))}:1`;
  for (const [a, b] of [['text', 'bg'], ['text', 'surface'], ['text-2', 'bg'], ['text-2', 'surface'], ['text-2', 'surface-2'], ['sur-accent', 'accent'],
    ['accent-texte', 'bg'], ['accent-texte', 'surface'], ['accent-texte', 'surface-2'], ['accent-texte', 'barre'],
    ['contour', 'bg'], ['contour', 'surface'], ['contour', 'surface-2'], ['donnee-2', 'surface']]) {
    assert.ok(contrastes.includes(paire(a, b)), `contrastes : --${a} sur --${b}, ${paire(a, b)}`);
  }
  assert.equal(paire('sur-accent', 'accent'), '4,55:1 / 9,88:1');
  // L'aplat de l'accent sur le fond clair, sous 4,5 : la raison du texte d'action à --accent-texte.
  for (const x of [`${deux(contraste(clair.accent, clair.bg))}:1 sur le fond clair`, `${deux(contraste(clair.accent, clair.surface))}:1 sur \`--surface\``]) {
    assert.ok(contrastes.includes(x), `contrastes : ${x}`);
  }
  assert.ok(contraste(clair.accent, clair.bg) < 4.5);
  const sens = section(v121, 'Les règles de sens (spec §3.2, inchangées)');
  for (const x of ['« Une seule couleur d\'accent, le vert (v12) »', '« Une seule couleur d\'accent, le bleu pétrole (v12.1) »', 'Pas d\'accent sur les écrans de l\'émotion ni sur « Réveil la nuit »',
    'Les graphiques sont à l\'encre (`--donnee*`)']) {
    assert.ok(sens.includes(x), `règles de sens : ${x}`);
  }
  const formes = section(v121, 'Les formes (spec §3.1, tâche A)');
  for (const x of ['**Le bandeau d\'Aujourd\'hui**', '« ‹ Retour »', '« Nouvelle version prête »', '**Les rubriques du soir**', '**Les pilules**', '**Moment difficile**']) {
    assert.ok(formes.includes(x), `formes : ${x}`);
  }
  const ligne = section(v121, 'La ligne du jour et le mot choisi (spec §2 points 2 et 3, §3.3, tâche B)');
  for (const x of ['`aria-live="polite"`', '`.visuellement-cache`', '« Enregistré »', '`PointsZones`', '`zonesDuJour`', '156 pt', '« Réduire les animations »', '`aria-pressed`']) {
    assert.ok(ligne.includes(x), `ligne du jour et mot choisi : ${x}`);
  }
  const disparu = section(v121, 'Ce qui disparaît');
  for (const x of ['#1C7D36', '#30D158', 'n\'apparaissent plus nulle part dans `public/`', 'les points des zones, le résumé de la journée et « Enregistré » à l\'écran', 'La double capsule']) {
    assert.ok(disparu.includes(x), `ce qui disparaît : ${x}`);
  }
  // Décision de l'utilisateur du 16/11 (« niveau design, fais comme Claude Design a défini ») : plus aucun écart de forme ; restent
  // les deux écarts de lisibilité qu'il n'a pas remis en cause (le texte d'action, la cible de « Détail › »).
  const ecarts = section(v121, 'Écarts au retour de Claude Design');
  for (const x of ['**Plus aucun écart de forme depuis le 16/11**', '`calc(var(--cible-bouton) / 2)`', '« Congé / repos »', '`--accent-texte`', '**La cible de « Détail › »**',
    '« Mémo vocal » et « Arrêter »']) {
    assert.ok(ecarts.includes(x), `écarts : ${x}`);
  }
  const lettre = section(v121, 'Les formes de la planche, à la lettre (décision du 16/11)');
  for (const x of ['« niveau design, fais comme Claude Design a défini »', 'reprennent le rayon 999', '« En consultation » (`.pilule`) aussi', 'identiques au pixel près',
    '« Mémo vocal » (12) et « Arrêter » (8)', 'les 62 valeurs de `tokens-3a.css`', '**Le défaut connu, accepté**', '« Congé / repos »', 'dès 40 px', '« Clinique »',
    'le « L » de LUNDI', 'la liste `HERITES` ne change pas', 'recette v12.1', 'quatre coins à 999']) {
    assert.ok(lettre.includes(x), `les formes à la lettre : ${x}`);
  }
  const formesA = section(v121, 'Les formes (spec §3.1, tâche A)');
  assert.ok(formesA.includes('`.pastille`, `.segmente button`, `.btn` (« En consultation », `.pilule`, compris)'), 'formes : les pilules à 999');
  assert.doesNotMatch(formesA, /ont un rayon de 26/);
  // La page du soir : sa hauteur mesurée, sous le budget de la spec v12 §5.4, sans test desserré ; les 30 s restent à l'iPhone.
  const controle = section(v121, 'Contrôle et mesures (tâches A, B et C)');
  for (const x of ['**1729 px**', '**2033 px**', '+118', 'n\'a pas été desserré', 'les 30 s restent à vérifier sur l\'iPhone (recette v12.1)', 'La liste `HERITES` ne change pas',
    '**Version 12.1.0**']) {
    assert.ok(controle.includes(x), `contrôle : ${x}`);
  }
  assert.doesNotMatch(v121, /se remplit (toujours )?en moins de 30 s/);
  const attente = section(v121, 'En attente de l\'utilisateur');
  // Le 16/11, le rayon 26 et les rayons bornés de la capsule de la date et d'En consultation ne sont plus en attente : à leur
  // place, sa décision et le défaut connu, à regarder sur l'iPhone.
  assert.ok(!attente.includes('Le rayon 26') && !/la moitié de sa hauteur sur une ligne/.test(attente), 'le rayon 26 encore en attente');
  for (const x of ['`docs/recette-iphone.md`', '**Publier la v12.1**', '**Les formes de la planche, en très grand texte**', 'on suit Claude Design à la lettre',
    '« Congé / repos » à partir de 40 px', '« Clinique »', 'la capsule de la date sur deux lignes', 'un défaut accepté de la planche', 'dans la plage déjà héritée d\'Aujourd\'hui',
    '**La page du soir avant 4 h**', '**L\'accent et Sérénité**', '**Moment difficile avec des refuges**', '**« Mémo vocal » et « Arrêter »**',
    '**Le disque de 156 n\'est pas propre au mot choisi**', 'rien n\'est changé sans son accord', 'v12.0.0 et v12.0.1 restent ouverts']) {
    assert.ok(attente.includes(x), `en attente : ${x}`);
  }
});

// La recette de la v12.1 : sept points, à cocher ; son compte tient quand l'utilisateur en coche un, ou qu'une section suit.
const sectionV121 = (recette) => recette.slice(recette.indexOf('## v12.1\n')).split(/\n(?=## )/)[0];

test('la section v12.1 de integration.md, du journal de version et de la recette (sept points, leur compte tient quand l\'utilisateur en coche un)', () => {
  const design = doc('docs', 'design', 'integration.md');
  const titre = design.match(/^## v12\.1 : .*\(14\/11\)$/m);
  assert.ok(titre, 'section v12.1 absente de docs/design/integration.md');
  assert.ok(titre.index > design.search(/^## v12 : /m), 'la section v12.1 suit la section v12');
  const v121d = design.slice(titre.index);
  for (const x of ['docs/superpowers/specs/2026-11-14-emozio-v12-1-design.md', 'docs/decisions.md', 'docs/design/retour-claude-design-v3/', '#2e7f99', '#62cbe8',
    '#f8f9fa', '#080b0d', '**Le bandeau d\'Aujourd\'hui**', '**Les rubriques à plat**', '**Les pilules**', '**Ce qui disparaît**', 'la ligne du jour', 'la double capsule',
    '1729 px', 'Le 16/11, l\'utilisateur a tranché : on suit la planche à la lettre', 'un défaut accepté de la planche']) {
    assert.ok(v121d.includes(x), `integration.md, v12.1 : ${x}`);
  }
  assert.doesNotMatch(v121d, /ont un rayon de 26|et non 999/, 'integration.md, v12.1 : le rayon borné');
  // Le haut du fichier, qui dit l'état actuel des jetons et de la sélection, renvoie à la v12.1.
  assert.match(design.slice(0, titre.index), /En v12\.1 :\s+la base « 3a »/);
  assert.match(design.slice(0, titre.index), /En v12\.1 : l'aplat pétrole/);
  const spec = doc('docs', 'v6-specification.md');
  const i = spec.indexOf('## 21. v12.1 (14/11)');
  assert.ok(i > spec.indexOf('## 20. v12 (09/11)'), 'section v12.1 absente du journal de version, ou avant la v12');
  for (const x of ['docs/superpowers/specs/2026-11-14-emozio-v12-1-design.md', 'docs/decisions.md', 'le bleu pétrole', 'format 9']) {
    assert.ok(spec.slice(i).includes(x), `journal de version, v12.1 : ${x}`);
  }
  const recette = doc('docs', 'recette-iphone.md');
  assert.ok(recette.includes('\n## v12.1\n'));
  const v121 = sectionV121(recette);
  for (const x of ['**Les couleurs, en clair et en sombre**', '`#f8f9fa`', '`#080b0d`', '**Le bandeau d\'Aujourd\'hui**', '« ‹ Retour »', '« Nouvelle version prête »',
    '**Les pilules**', '« Congé / repos »', '**La page du soir**', 'chacun en moins de 30 s', '13 px de plus', '**Plus rien sous le titre**',
    '**« Enregistré » annoncé par VoiceOver**', 'VoiceOver dit « Enregistré »', '**Le mot choisi, un disque**', '« Réduire les animations »',
    'dans une pastille devenue ovale', '« Clinique »', 'la capsule de la date devient alors un ovale']) {
    assert.ok(v121.includes(x), `recette v12.1 : ${x}`);
  }
  const cochee = recette.replace('- [ ] **Le mot choisi, un disque**', '- [x] **Le mot choisi, un disque**');
  const suivie = `${cochee.trimEnd()}\n\n## v13\n\n- [ ] Un point d'après.\n`;
  for (const r of [recette, cochee, suivie]) assert.equal((sectionV121(r).match(/^- \[[ xX]\] /gm) || []).length, 7);
});

test('la version 12.1.1 : package.json et js/version.js (écrit par npm run precache)', () => {
  assert.equal(JSON.parse(doc('package.json')).version, '12.1.1');
  assert.match(doc('public', 'js', 'version.js'), /^export const VERSION_APP = '12\.1\.1';$/m);
});
