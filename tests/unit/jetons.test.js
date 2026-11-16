import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { RACINE, lister, rel, lire, sansCommentaires } from '../aides/fichiers.js';
import { contraste, ecartTeinte, ecartOklab, oklch, jetons, FAMILLES_ROUE, ZONES_ROUE, ROLES } from '../aides/couleurs.js';

// v7 · Fondations 2b (plan v7, tâche 1) : jetons des 7 familles de la roue des émotions, en clair et en sombre ; contraste
// AA ; aucune variable CSS sans valeur. v9 (tâche 3) : les 4 zones de la carte des émotions. v12 (tâche 3, spec §5.2 et
// §5.3) : une seule couleur d'accent et plus de couleur de rubrique. v12.1 (spec 2026-11-14 §3.1, §3.2 et §5) : la palette
// « 3a » de Claude Design (docs/design/retour-claude-design-v3/tokens-3a.css), une base presque blanche aux surfaces
// teintées de bleu pétrole, et l'accent pétrole, à la place de la base neutre façon iOS et du vert B de la v12.
const CSS = lister(join(RACINE, 'public', 'css'), (p) => p.endsWith('.css'));
const JS = lister(join(RACINE, 'public', 'js'), (p) => p.endsWith('.js') && !p.includes('/vendor/'));
const TOKENS = lire(join(RACINE, 'public', 'css', 'tokens.css'));
const { clair, sombre, sombreSeul } = jetons(TOKENS);
const THEMES = [['clair', clair], ['sombre', sombre]];
// v12.1 : un gris, ou une teinte de la base pétrole (teinte de 215 à 230°, saturation sous 0,05) : la base et l'encre.
const petrole = (v) => { const o = oklch(v); return o.C < 0.02 || (o.C < 0.05 && o.H >= 215 && o.H <= 230); };
const TOUTES = [...FAMILLES_ROUE.map((f) => `emo-${f}`), ...ZONES_ROUE.map((z) => `zone-${z}`)];
// Les règles des feuilles, sans commentaires : [sélecteur, déclarations].
const REGLES = CSS.flatMap((f) => [...sansCommentaires(lire(f)).matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((m) => [m[1].replace(/\s+/g, ' ').trim(), m[2].replace(/\s+/g, ' ').trim(), rel(f)]));

test('aucune variable CSS non définie : chaque var(--x) des feuilles (et du JS) est déclarée dans une feuille', () => {
  const declarees = new Set();
  const fautes = [];
  for (const f of CSS) for (const m of sansCommentaires(lire(f)).matchAll(/(--[\w-]+)\s*:/g)) declarees.add(m[1]);
  for (const f of [...CSS, ...JS]) {
    for (const m of sansCommentaires(lire(f)).matchAll(/var\(\s*(--[\w-]+)/g)) if (!declarees.has(m[1])) fautes.push(`${rel(f)} : ${m[1]}`);
  }
  assert.deepEqual([...new Set(fautes)], []);
});

test('v10 : une seule police, la police système : ni --police-serif, ni ui-serif, ni Georgia, ni New York dans public/, commentaires compris', () => {
  const textes = lister(join(RACINE, 'public'), (p) => /\.(css|js|html)$/.test(p) && !p.includes('/vendor/'));
  assert.ok(textes.length > CSS.length, 'le CSS, le JS et le HTML sont lus');
  const fautes = [];
  for (const f of textes) {
    for (const m of lire(f).matchAll(/--police-serif|ui-serif|georgia|new york|(?<!sans-)serif/gi)) fautes.push(`${rel(f)} : ${m[0]}`);
  }
  assert.deepEqual(fautes, []);
  assert.match(TOKENS, /--police: -apple-system/);
});

test('v10 : docs/design/integration.md ne donne plus la serif pour l\'état actuel : chaque mention dit jusqu\'à quand (la v7 hors du relevé, la v10 dans le relevé)', () => {
  const lignes = lire(join(RACINE, 'docs', 'design', 'integration.md')).split('\n');
  const mentions = lignes.filter((l) => /ui-serif|new york|serif/i.test(l));
  assert.equal(mentions.length, 3);
  assert.deepEqual(mentions.filter((l) => !/jusqu'à la v7|police système depuis la v10/.test(l)), []);
});

// ---------- v12 · La base et l'accent (spec §5.2 et §5.3) ; v12.1 : les valeurs 3a ----------
const BASE = ['bg', 'surface', 'surface-2', 'barre', 'line', 'contour', 'text', 'text-2', 'desactive', 'piste', 'fenetre',
  'accent', 'sur-accent', 'accent-texte', 'donnee', 'donnee-1', 'donnee-2', 'donnee-3'];
const TOKENS_3A = lire(join(RACINE, 'docs', 'design', 'retour-claude-design-v3', 'tokens-3a.css'));

test('v12.1 : la base et l\'accent pétrole, aux valeurs exactes de tokens-3a.css (README de Claude Design), en clair et en sombre ; --action et --action-on sont les alias de l\'accent ; un choix non fait a le fond --surface', () => {
  assert.deepEqual(BASE.map((n) => clair[n]), ['#f8f9fa', '#e8f1f4', '#dae8ed', '#f1f6f8', '#c3d6dd', '#627a83', '#0a1c22', '#40535a',
    '#b7c9d0', '#e8f1f4', '#ffffff', '#2e7f99', '#ffffff', '#1f6c85', '#3c525c', '#bdcfd6', '#657e87', '#1f343c']);
  assert.deepEqual(BASE.map((n) => sombre[n]), ['#080b0d', '#10252c', '#19353f', '#0c181d', '#24434e', '#6c8c97', '#f3f8f9', '#9fb7bf',
    '#33505a', '#10252c', '#2f5563', '#62cbe8', '#04161c', '#62cbe8', '#a8bec6', '#2b4751', '#7a939c', '#e2edf0']);
  // Chaque jeton de tokens-3a.css est reporté à l'identique dans tokens.css, en clair et en sombre (le fichier de Claude
  // Design en est la source : une valeur changée d'un seul côté se voit).
  const ref = jetons(TOKENS_3A);
  for (const [theme, t, r] of [['clair', clair, ref.clair], ['sombre', sombre, ref.sombre]]) {
    const ecarts = Object.keys(r).filter((n) => t[n] !== r[n]).map((n) => `--${n} : ${t[n]} au lieu de ${r[n]}`);
    assert.deepEqual(ecarts, [], theme);
  }
  assert.ok(Object.keys(ref.sombreSeul).length >= 30, 'les jetons sombres de tokens-3a.css sont lus');
  // Les alias : déclarés une fois, sur la racine, et jamais redéfinis en sombre (ils y suivent l'accent du thème).
  const racine = sansCommentaires(TOKENS).match(/^:root\s*\{([\s\S]*?)\n\}/m)[1];
  assert.match(racine, /--action: var\(--accent\);/);
  assert.match(racine, /--action-on: var\(--sur-accent\);/);
  assert.equal(sombreSeul.action, undefined);
  assert.equal(sombreSeul['action-on'], undefined);
  for (const [, t] of THEMES) assert.deepEqual([t.action, t['action-on'], t['fond-choix']], [t.accent, t['sur-accent'], t.surface]);
  // theme-color et le manifest : le fond de chaque thème (le manifest n'en a qu'un : celui du clair).
  const index = lire(join(RACINE, 'public', 'index.html'));
  assert.match(index, /<meta name="theme-color" content="#f8f9fa" media="\(prefers-color-scheme: light\)">/);
  assert.match(index, /<meta name="theme-color" content="#080b0d" media="\(prefers-color-scheme: dark\)">/);
  assert.deepEqual([clair.bg, sombre.bg], ['#f8f9fa', '#080b0d']);
  const manifest = JSON.parse(lire(join(RACINE, 'public', 'manifest.webmanifest')));
  assert.deepEqual([manifest.background_color, manifest.theme_color], ['#f8f9fa', '#f8f9fa']);
});

// Relecture de la tâche 4 : la marge était restée à 14, celle du lot 2b, au lieu des 16 de la spec. v12.1 (3a) : cartes de 24,
// grand titre 40/47 ; --r-moyen, --r-bouton et --r-petit ne changent pas (les tuiles de l'Analyse les lisent), ce qui se
// touche passe en pilule par sélecteur.
test('v12.1 : les formes : rayon des cartes 24, marge 16, grand titre 40/47 (plafonné à 48), titre de section 22/28, libellé d\'onglet 10 ; les rayons 12, 12 et 10 inchangés', () => {
  assert.deepEqual(['r-carte', 'marge', 't-grand-titre', 'l-grand-titre', 't-titre-section', 'l-titre-section', 't-onglet'].map((n) => clair[n]),
    ['24px', '16px', 'min(2.35rem, 48px)', 'min(2.75rem, 58px)', '1.294rem', '1.647rem', '10px']);
  assert.deepEqual(['r-moyen', 'r-bouton', 'r-petit', 'r-feuille'].map((n) => clair[n]), ['12px', '12px', '10px', '24px']);
  for (const n of ['r-carte', 'marge', 't-grand-titre', 'l-grand-titre']) assert.equal(sombreSeul[n], undefined, n);
});

// v12.1 : les règles de formes-3a.css, fondues dans composants.css et ecrans.css : chacune de leurs déclarations est dans une
// règle d'un des mêmes sélecteurs. La bande du bas (.action-bande, .fab) a sa règle, plus forte, sous .actions-flottantes : la
// pilule y est posée (README : « les boutons de la bande en pilule »). Décision de l'utilisateur du 16/11 (« niveau design,
// fais comme Claude Design a défini ») : aucun écart de forme. La pastille, le bouton de segmenté et la capsule de la date
// (.sur-titre) reprennent le rayon 999 de la planche (26, puis la moitié de la hauteur d'une ligne, depuis la relecture de la
// tâche A et la relecture finale), « En consultation » (.pilule) aussi, comme un .btn.
test('v12.1 : les formes 3a sont fondues dans les feuilles : chaque déclaration de formes-3a.css est dans une règle d\'un de ses sélecteurs, sans écart', () => {
  const FORMES = sansCommentaires(lire(join(RACINE, 'docs', 'design', 'retour-claude-design-v3', 'formes-3a.css')));
  const selecteurs = (sel) => sel.split(/,(?![^(]*\))/).map((x) => x.replace(/\s+/g, ' ').trim());
  const PLUS_FORTS = { '.action-bande': '.actions-flottantes .action-bande', '.fab': '.actions-flottantes .fab' };
  const fautes = [];
  let n = 0;
  for (const [, sel, corps] of FORMES.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const s of selecteurs(sel)) {
      for (const [, prop, val] of corps.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) {
        n += 1;
        const decl = `${prop}: ${val.trim()};`;
        // Un élément de la bande : sa règle sous .actions-flottantes, et la sienne seule s'il en a une (.fab, hors de la bande).
        const cibles = PLUS_FORTS[s] ? [PLUS_FORTS[s], ...(REGLES.some(([x]) => selecteurs(x).includes(s)) ? [s] : [])] : [s];
        if (!cibles.every((c) => REGLES.some(([x, d]) => selecteurs(x).includes(c) && d.includes(decl)))) fautes.push(`${s} { ${decl} }`);
      }
    }
  }
  assert.ok(n >= 30, `${n} déclarations lues`);
  assert.deepEqual(fautes, []);
  // Aucune règle d'un élément que la planche met en pilule n'y remet un autre rayon que 999 (le segmenté « petit » avait
  // --r-petit, la pastille et le segmenté 26, la capsule de la date la moitié de sa hauteur, « En consultation » 26) ; une
  // règle qui vise un de ces éléments par une autre de ses classes est vue par le contrôle global (v7-controle.spec.js,
  // PILULES_PLANCHE), sur chaque écran du parcours.
  const PILULES = /\.(pastille|segmente|roue-choix|btn|puce-reglage|action-bande|fab|exercice-court|sur-titre|pilule)(?![\w-])/;
  const remis = REGLES.filter(([sel, d]) => sel.split(/,(?![^(]*\))/).some((x) => PILULES.test(x)) && /border-radius: (?!999px;)/.test(d)).map(([sel]) => sel);
  assert.deepEqual(remis, []);
  for (const sel of ['.pastille', '.segmente button', '.sur-titre', '.pilule', '.btn']) {
    assert.ok(REGLES.some(([x, d]) => x.split(/,(?![^(]*\))/).map((y) => y.trim()).includes(sel) && d.includes('border-radius: 999px;')), `${sel} : rayon 999`);
  }
  // Ce que la planche ne nomme pas garde son rayon : « Mémo vocal » (12) et « Arrêter » (8) restent des rectangles arrondis.
  const rayonDe = (sel) => REGLES.filter(([x]) => x.split(/,(?![^(]*\))/).map((y) => y.trim()).includes(sel)).flatMap(([, d]) => [...d.matchAll(/border-radius: ([^;]+);/g)].map((m) => m[1]));
  assert.deepEqual([rayonDe('.btn-memo'), rayonDe('.btn-arreter')], [['var(--r-bouton)'], ['8px']]);
});

test('v12 : AA du texte et du texte secondaire sur le fond, la carte et --surface-2 ; l\'accent et le texte posé dessus à 4,5:1 au moins', () => {
  for (const [theme, t] of THEMES) {
    for (const fond of ['bg', 'surface', 'surface-2']) {
      assert.ok(contraste(t.text, t[fond]) >= 4.5, `${theme} : texte sur ${fond}`);
      assert.ok(contraste(t['text-2'], t[fond]) >= 4.5, `${theme} : texte secondaire sur ${fond} (${contraste(t['text-2'], t[fond]).toFixed(2)})`);
    }
    assert.ok(contraste(t['sur-accent'], t.accent) >= 4.5, `${theme} : sur l'accent (${contraste(t['sur-accent'], t.accent).toFixed(2)})`);
  }
});

// v12.1 : --accent-texte, plus foncé que --accent en clair, tient 4,5:1 sur les surfaces teintées, --surface-2 comprise
// (4,73:1 ; 4,49:1 en v12, d'où la règle « jamais un lien sur --surface-2 », gardée par prudence : tests/aides/controle.js).
test('v12.1 : un lien (--accent-texte) à 4,5:1 au moins sur le fond, la carte, --surface-2 et la barre, en clair et en sombre', () => {
  for (const [theme, t] of THEMES) {
    for (const fond of ['bg', 'surface', 'surface-2', 'barre']) {
      assert.ok(contraste(t['accent-texte'], t[fond]) >= 4.5, `${theme} : lien sur ${fond} (${contraste(t['accent-texte'], t[fond]).toFixed(2)})`);
    }
  }
  assert.equal(contraste(clair['accent-texte'], clair['surface-2']).toFixed(2), '4.73');
});

// v12.1 : --accent (l'aplat) est plus clair que --accent-texte en clair (4,32:1 sur le fond, 3,97:1 sur --surface) : un
// texte ou une icône qui ouvre quelque chose prend --accent-texte, jamais --accent ni son alias --action (relevé par le
// contrôle de contraste de v12-spotify.spec.js : « Retour », « Modifier », « Coller un lien » sous 4,5:1).
test('v12.1 : aucun texte à l\'aplat de l\'accent : color ne lit jamais --accent ni --action, seulement --accent-texte', () => {
  const fautes = REGLES.filter(([, d]) => /(^|[\s;{])color:\s*var\(--(accent|action)\)/.test(d)).map(([sel, , f]) => `${f} : ${sel}`);
  assert.deepEqual(fautes, []);
  assert.ok(contraste(clair.accent, clair.bg) < 4.5, 'en clair, l\'aplat seul ne tient pas 4,5:1 sur le fond');
  assert.ok(REGLES.some(([sel, d]) => sel === 'a' && d.includes('color: var(--accent-texte);')));
});

// v12.1 : les contrastes que donne le README de Claude Design (docs/design/retour-claude-design-v3/README.md), recalculés depuis
// les jetons, au centième près. Le texte posé sur l'accent en clair est très juste (4,55:1) : --accent ne s'éclaircit pas sans
// que --sur-accent passe au foncé.
test('v12.1 : les contrastes du README de Claude Design, recalculés depuis les jetons, en clair et en sombre ; --sur-accent sur --accent en clair à 4,55:1', () => {
  const ATTENDUS = [
    ['text', 'bg', 16.57, 18.43], ['text', 'surface', 15.24, 14.82], ['text-2', 'bg', 7.65, 9.40], ['text-2', 'surface', 7.04, 7.56],
    ['text-2', 'surface-2', 6.43, 6.16], ['sur-accent', 'accent', 4.55, 9.88], ['accent-texte', 'bg', 5.62, 10.55],
    ['accent-texte', 'surface', 5.17, 8.49], ['accent-texte', 'surface-2', 4.73, 6.92], ['accent-texte', 'barre', 5.44, 9.64],
    ['contour', 'bg', 4.30, 5.48], ['contour', 'surface', 3.96, 4.41], ['contour', 'surface-2', 3.62, 3.60], ['donnee-2', 'surface', 3.75, 4.90],
  ];
  const fautes = ATTENDUS.flatMap(([a, b, c, s]) => [['clair', clair, c], ['sombre', sombre, s]]
    .filter(([, t, v]) => contraste(t[a], t[b]).toFixed(2) !== v.toFixed(2))
    .map(([theme, t, v]) => `${theme} : --${a} sur --${b}, ${contraste(t[a], t[b]).toFixed(2)} au lieu de ${v.toFixed(2)}`));
  assert.deepEqual(fautes, []);
  // Le README les écrit tels quels (« 4,55:1 »).
  const readme = lire(join(RACINE, 'docs', 'design', 'retour-claude-design-v3', 'README.md'));
  assert.match(readme, /\| --sur-accent sur --accent \| 4,55:1 \| 9,88:1 \|/);
});

test('v12 : le contour (choix non faits, champs, roues) à 3:1 au moins sur le fond, la carte et --surface-2', () => {
  for (const [theme, t] of THEMES) {
    for (const fond of ['bg', 'surface', 'surface-2']) {
      assert.ok(contraste(t.contour, t[fond]) >= 3, `${theme} : contour sur ${fond} (${contraste(t.contour, t[fond]).toFixed(2)})`);
    }
  }
});

// Relecture de la tâche 3 : « Réveil la nuit » (.parcours.ecran-noir) redéclare son contour, sa carte et --surface-2. Son
// contour (champs, rail et bouton de l'interrupteur éteint) suit la même règle, sur ses propres fonds (il était à 2,81:1 sur
// la carte et 2,60:1 sur --surface-2), et reste plus sombre que son texte : la nuit n'éclaire pas la chambre.
test('v12 : la nuit aussi, le contour de .parcours.ecran-noir à 3:1 au moins sur son fond, sa carte et son --surface-2, plus sombre que son texte', () => {
  const declare = (selecteur) => Object.fromEntries(REGLES.filter(([sel]) => sel === selecteur)
    .flatMap(([, d]) => [...d.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])));
  const nuit = { ...declare('.ecran-noir'), ...declare('.parcours.ecran-noir') };
  for (const n of ['bg', 'surface', 'surface-2', 'contour', 'text']) assert.match(nuit[n] || '', /^#[0-9a-f]{6}$/, `--${n} de la nuit`);
  assert.equal(nuit.contour, declare('.parcours.ecran-noir').contour, 'le contour est redéclaré par .parcours.ecran-noir');
  for (const fond of ['bg', 'surface', 'surface-2']) {
    assert.ok(contraste(nuit.contour, nuit[fond]) >= 3, `nuit : contour sur ${fond} (${contraste(nuit.contour, nuit[fond]).toFixed(2)})`);
  }
  assert.ok(contraste(nuit.contour, nuit.bg) < contraste(nuit.text, nuit.bg), 'nuit : le contour moins clair que le texte');
});

// v12.1 : l'accent pétrole est loin de la menthe dans les deux thèmes (en v12, le vert iPhone sombre en était à 0,07). Il est
// plus près de la zone bleue (≈ 0,11 en clair), dont sa teinte reste à plus de 40° : c'est la forme qui les sépare (jamais un
// rond ni un point d'accent) et les lieux (pas d'accent sur les écrans de l'émotion ni dans les graphiques, plus bas).
test('v12.1 : l\'accent est loin de la menthe des zones (ΔE OKLab ≥ 0,12), en clair et en sombre, et à 40° au moins de la teinte de la zone bleue ; l\'encre des graphiques, de la teinte de la base, se voit sur la carte', () => {
  // La menthe : le plein de la zone verte (bulles, points, cases), son accent et son texte en sombre.
  const menthe = [clair['c-zone-vert-fill'], sombre['c-zone-vert'], sombre['c-zone-vert-text']];
  assert.deepEqual(menthe, ['#4ce39b', '#4ce39b', '#44dd95']);
  for (const [theme, t] of THEMES) {
    for (const m of menthe) {
      for (const n of ['accent', 'accent-texte']) assert.ok(ecartOklab(t[n], m) >= 0.12, `${n} ${theme} et ${m} : ${ecartOklab(t[n], m).toFixed(3)}`);
    }
    for (const b of [t['c-zone-bleu'], t['c-zone-bleu-fill']]) assert.ok(ecartTeinte(t.accent, b) >= 40, `${theme} : accent et zone bleue ${b}, ${ecartTeinte(t.accent, b).toFixed(0)}°`);
  }
  for (const [theme, t] of THEMES) {
    // L'encre (v12.1) : à peine teintée, de la teinte de la base pétrole, jamais aussi saturée que l'accent.
    for (const n of ['donnee', 'donnee-1', 'donnee-2', 'donnee-3']) assert.ok(petrole(t[n]), `${theme} : --${n} (${t[n]}), une encre de la base`);
    assert.ok(contraste(t.donnee, t.surface) >= 4.5, `${theme} : --donnee sur la carte`);
    assert.ok(contraste(t['donnee-2'], t.surface) >= 3, `${theme} : --donnee-2, contour du pas le plus discret, sur la carte`);
  }
});

// Relecture finale de la v12.1 : l'accent pétrole est voisin de Sérénité (turquoise), surtout en sombre (teintes à 26°, même
// clarté). Ce sont la forme et les lieux qui les séparent : l'accent n'est jamais une marque de graphique, Sérénité jamais un
// contrôle. Les jetons, définitifs (spec v12.1 §3.1), ne changent pas sans l'accord de l'utilisateur (docs/decisions.md,
// v12.1.0, « En attente de l'utilisateur ») ; ce garde-fou fige les écarts d'aujourd'hui (ΔE OKLab au plus près : 0,058 en
// clair, entre --accent-texte et --c-emo-serenite-text ; 0,048 en sombre, entre l'accent et --c-emo-serenite-text), pour
// qu'ils ne rétrécissent pas.
test('v12.1 : l\'accent ne se rapproche pas de Sérénité : ΔE OKLab de l\'accent et du texte d\'action à 0,055 au moins de ses rôles --c, -fill et -text en clair, à 0,045 au moins en sombre', () => {
  for (const [theme, t, plancher] of [['clair', clair, 0.055], ['sombre', sombre, 0.045]]) {
    for (const a of ['accent', 'accent-texte']) {
      for (const r of ['', '-fill', '-text']) {
        const d = ecartOklab(t[a], t[`c-emo-serenite${r}`]);
        assert.ok(d >= plancher, `${theme} : --${a} et --c-emo-serenite${r}, ΔE OKLab ${d.toFixed(3)}`);
      }
    }
  }
});

test('v12 : les rubriques n\'ont plus de couleur : ni --c-<rubrique>, ni --chart-*, ni .teinte-*, ni --r-icone, dans aucune feuille', () => {
  const RUBRIQUES = ['lieu', 'sommeil', 'contact', 'sport', 'traitement', 'positifs', 'humeur', 'episode', 'symptome', 'difficile', 'energie', 'explosions'];
  const motif = new RegExp(`--c-(${RUBRIQUES.join('|')})\\b|--chart-|\\.teinte-|--r-icone`, 'g');
  const fautes = [];
  for (const f of CSS) for (const m of sansCommentaires(lire(f)).matchAll(motif)) fautes.push(`${rel(f)} : ${m[0]}`);
  assert.deepEqual(fautes, []);
  // Les couleurs de la base, des familles et des zones seulement : hors des familles, des zones et de l'accent, chaque
  // couleur de jeton est un gris ou une teinte de la base pétrole (v12.1 : teinte de 215 à 230°, saturation sous 0,05), sauf
  // --danger. L'accent a la même teinte, bien plus saturé (0,08 au moins).
  for (const [theme, t] of THEMES) {
    const teintes = Object.entries(t).filter(([n, v]) => /^#[0-9a-f]{6}$/i.test(v) && !/^c-(emo|zone)-|^(accent|accent-texte|action)$/.test(n) && !petrole(v));
    assert.deepEqual(teintes.map(([n]) => n), ['danger'], theme);
    for (const n of ['accent', 'accent-texte']) assert.ok(oklch(t[n]).C >= 0.08 && oklch(t[n]).H >= 215 && oklch(t[n]).H <= 230, `${theme} : --${n}`);
  }
});

// v12 (9/9), contrôle global : les 12 couleurs de rubrique du lot 2b et la rampe du sommeil, telles que la v11.0.0 les
// déclarait (six rôles en clair, quatre en sombre), ne reviennent nulle part dans public/ : ni leurs valeurs (écrites en dur
// dans une feuille, un écran, une icône ou le manifest), ni leurs noms, ni une classe teinte-. Deux valeurs sont aussi celles
// d'une famille d'émotion, qui les garde (le texte posé sur Dégoût et sur Peur) : elles ne comptent pas.
const LOT_2B = {
  lieu: '#937c61 #cfb69a #171008 #f6ede2 #ecddcd #67543e #ccb397 #261c11 #362919 #d0baa1',
  sommeil: '#5f74e4 #829afc #0e111b #e9eeff #d5dffe #3d4daa #9fb3fc #161c36 #20284b #a7bafe',
  contact: '#1090a3 #27d0eb #071417 #d5f5fc #b6eaf5 #0c6371 #1fcde8 #002228 #00323a #1fd4f0',
  sport: '#279936 #6bd672 #0c140c #e1f5e0 #caeaca #046b1b #68d36f #0c230d #133416 #7bd77f',
  traitement: '#8c6aca #b392f6 #131019 #f0ebff #e3dafb #624595 #c1a6fc #221b31 #2f2543 #c7aefe',
  positifs: '#938013 #efd127 #141207 #f4efd5 #e9e1b7 #665801 #d2b723 #241e00 #332b01 #d8be34',
  humeur: '#ca4b85 #ff88b9 #190e12 #fee7ef #ffd1e1 #93285c #ff8ebc #311420 #441c2d #fe9ac2',
  episode: '#b156b7 #dc7ee2 #160f16 #fbe7fc #f3d4f4 #803385 #ed8ef3 #2b162c #3b1f3d #ee9af3',
  symptome: '#02967c #1ae7c2 #081511 #d7f7ed #baecdd #056755 #0dd5b2 #00241c #00342a #09dcb8',
  difficile: '#5885ab #85b4dc #0a131a #e5f0fa #d1e2f1 #365c7b #8ebde6 #141f29 #1d2d3b #9ac3e7',
  energie: '#b96a00 #fca34c #181008 #ffeada #fbd8bb #804802 #fc9e3f #301903 #422301 #fea753',
  explosions: '#a7725a #c79077 #190f0a #f9ebe5 #f0dad1 #784c38 #e2a88f #281a14 #39261e #e4b19a',
  'chart-sommeil': '#c5d0f3 #7e93e2 #4455c2 #394473 #6073c7 #9fb3fe',
};

test('v12 : aucune trace des 12 couleurs de rubrique du lot 2b dans public/ : ni leurs valeurs, ni leurs noms, ni une classe teinte-', () => {
  assert.equal(Object.keys(LOT_2B).length, 13);
  const emotions = new Set(THEMES.flatMap(([, t]) => Object.entries(t).filter(([n]) => /^c-(emo|zone)-/.test(n)).map(([, v]) => String(v).toLowerCase())));
  const valeurs = Object.values(LOT_2B).flatMap((l) => l.split(' '));
  assert.equal(valeurs.length, 12 * 10 + 6);
  const gardees = valeurs.filter((v) => emotions.has(v));
  assert.deepEqual(gardees, ['#131019', '#190f0a']);
  const retirees = valeurs.filter((v) => !emotions.has(v));
  const fichiers = lister(join(RACINE, 'public'), (p) => /\.(css|js|html|svg|webmanifest|json)$/.test(p) && !p.includes('/vendor/'));
  assert.ok(fichiers.some((f) => f.endsWith('manifest.webmanifest')) && fichiers.some((f) => f.endsWith('.svg')) && fichiers.length > CSS.length + JS.length);
  const noms = new RegExp(`--c-(${Object.keys(LOT_2B).filter((n) => n !== 'chart-sommeil').join('|')})\\b|--chart-sommeil|\\bteinte-[a-z]|\\bteinte=`, 'g');
  const fautes = [];
  for (const f of fichiers) {
    const texte = lire(f).toLowerCase();
    for (const v of retirees) if (texte.includes(v)) fautes.push(`${rel(f)} : ${v}`);
    for (const m of texte.matchAll(noms)) fautes.push(`${rel(f)} : ${m[0]}`);
  }
  assert.deepEqual(fautes, []);
  // Le contrôle voit bien un nom revenu, et le vert du sport parmi les valeurs cherchées.
  assert.ok(retirees.includes('#279936') && retirees.includes('#4455c2'));
  assert.ok(['<div class="carte teinte-sport">', 'color: var(--c-sport-fill)', 'stroke: var(--chart-sommeil-2)', 'teinte=${t}'].every((x) => x.match(noms)));
  assert.ok(!'--c-emo-joie-fill --c-zone-vert'.match(noms));
});

// v12, point de vigilance 3 : les écrans de l'émotion (.moment-plein) et « Réveil la nuit » (.ecran-noir) n'ont aucun
// accent. Leurs règles redéclarent --accent, --sur-accent, --accent-texte, --action et --action-on à l'encre (des gris
// sans teinte, dans les deux thèmes), et aucune feuille ne lit l'accent dans ces écrans.
test('v12 : pas d\'accent dans .moment-plein ni dans .ecran-noir : l\'accent y est redéclaré à l\'encre, et aucune feuille ne l\'y lit', () => {
  const ACCENTS = ['accent', 'sur-accent', 'accent-texte', 'action', 'action-on'];
  const declare = (selecteur) => {
    const r = REGLES.filter(([sel]) => sel === selecteur);
    assert.ok(r.length > 0, selecteur);
    return Object.fromEntries(r.flatMap(([, d]) => [...d.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])));
  };
  const neutre = (v, quoi) => assert.ok(/^#[0-9a-f]{6}$/.test(v) && oklch(v).C < 0.02, `${quoi} : ${v}, une encre sans teinte`);
  // Les écrans de l'émotion : l'accent est le plein des ronds (Continuer, Terminer), à l'encre dans les deux thèmes (v12.1 :
  // l'encre et le fond de la base, à peine teintés de pétrole, jamais l'accent).
  const moment = declare('.moment-plein');
  assert.deepEqual(ACCENTS.map((n) => moment[n]), ['var(--moment-plein)', 'var(--moment-plein-on)', 'var(--moment-plein)', 'var(--moment-plein)', 'var(--moment-plein-on)']);
  for (const [theme, t] of THEMES) {
    for (const n of ['moment-plein', 'moment-plein-on']) {
      assert.ok(/^#[0-9a-f]{6}$/.test(t[n]) && petrole(t[n]), `${theme} --${n} : ${t[n]}, une encre de la base`);
      assert.notEqual(t[n], t.accent);
    }
  }
  // La nuit : des valeurs, sans var() (un var(--accent) y serait lu avant d'être redéclaré, sur la racine, au pétrole de l'accent).
  for (const sel of ['.ecran-noir', '.parcours.ecran-noir']) {
    const d = declare(sel);
    for (const n of ACCENTS) if (d[n] !== undefined) neutre(d[n], `${sel} --${n}`);
  }
  assert.deepEqual(ACCENTS.filter((n) => declare('.ecran-noir')[n] === undefined), []);
  assert.deepEqual(['accent', 'accent-texte', 'action'].filter((n) => declare('.parcours.ecran-noir')[n] === undefined), []);
  // Aucune règle de ces écrans ne lit l'accent, et la valeur de l'accent n'est écrite que dans tokens.css.
  const fautes = REGLES.filter(([sel, d]) => /\.moment-plein|\.ecran-noir/.test(sel) && /var\(\s*--(accent|sur-accent|accent-texte)\b/.test(d)).map(([sel]) => sel);
  assert.deepEqual(fautes, []);
  const accents = new RegExp([clair.accent, sombre.accent, clair['accent-texte']].join('|'), 'i');
  assert.deepEqual(CSS.filter((f) => !f.endsWith('tokens.css') && accents.test(sansCommentaires(lire(f)))).map(rel), []);
});

test('v12 : un choix fait est un aplat d\'accent (ou de sa famille, de sa zone) au texte --sur-accent, en 600, avec sa coche ; non fait, le fond --fond-choix (--surface en v12.1) avec son contour, en pilule ; rien ne change de taille au toucher', () => {
  // Les déclarations de toutes les règles d'un sélecteur, à la suite.
  const decl = (selecteur) => {
    const r = REGLES.filter(([sel]) => sel.split(/,(?![^(]*\))/).map((x) => x.trim()).includes(selecteur));
    assert.ok(r.length > 0, selecteur);
    return r.map(([, d]) => d).join(' ');
  };
  for (const sel of ['.pastille', '.segmente button']) {
    assert.match(decl(sel), /background: var\(--fond-choix\);/, sel);
    assert.match(decl(sel), /border-radius: 999px;/, `${sel} : en pilule de 999 (v12.1, formes 3a ; décision du 16/11)`);
    assert.match(decl(sel), /box-shadow: inset 0 0 0 1px var\(--contour\);/, sel);
    assert.doesNotMatch(decl(sel), /font-weight/, `${sel} : en 400`);
    const fait = decl(`${sel}[aria-pressed="true"]`);
    assert.match(fait, /background: var\(--c-fill, var\(--action\)\); color: var\(--c-on, var\(--action-on\)\); box-shadow: none; font-weight: 600;/, sel);
  }
  // La coche : montrée devant le libellé d'un choix fait, cachée sinon.
  assert.match(decl('.coche'), /display: none;/);
  assert.match(decl('[aria-pressed="true"] > .coche'), /display: inline-flex;/);
  // Ni rebond ni agrandissement : aucune règle d'un choix fait ne pose transform ou animation.
  const bougent = REGLES.filter(([sel, d]) => /aria-pressed="true"/.test(sel) && /\b(transform|animation)\s*:/.test(d)).map(([sel]) => sel);
  assert.deepEqual(bougent, []);
  assert.ok(CSS.every((f) => !/@keyframes rebond/.test(lire(f))));
  // La roue : une piste au contour, la fenêtre neutre puis d'accent, la valeur notée en --sur-accent et en 600.
  assert.match(decl('.roue-choix'), /background: var\(--piste\); box-shadow: inset 0 0 0 1px var\(--contour\);/);
  assert.match(decl('.roue-choix::before'), /background: var\(--fenetre\);/);
  assert.match(decl('.roue-choix.notee::before'), /background: var\(--accent\);/);
  assert.match(decl('.roue-valeur[aria-pressed="true"]'), /font-weight: 600; color: var\(--sur-accent\);/);
  // L'interrupteur : un rail d'accent et un bouton blanc, comme sur iOS.
  assert.match(decl('.interrupteur[aria-checked="true"]'), /background: var\(--action\);/);
  assert.match(decl('.interrupteur[aria-checked="true"] .interrupteur-bouton'), /background: #ffffff;/);
});

// v12 (3/9) : la couleur ne dit plus qu'une émotion, et ses couleurs ne bougent pas. L'empreinte des 132 valeurs des
// 7 familles et des 4 zones (six rôles, en clair et en sombre), calculée sur les jetons de la v11.0.0 : la refonte de la
// base et de l'accent n'en change aucune.
test('v12 : les familles et les zones sont inchangées depuis la v11 : leurs six rôles, en clair et en sombre, à l\'octet', () => {
  const valeurs = TOUTES.flatMap((c) => ROLES.flatMap((r) => [['clair', clair], ['sombre', sombre]].map(([theme, t]) => `${theme} --c-${c}${r}: ${t[`c-${c}${r}`]}`)));
  assert.equal(valeurs.length, 132);
  assert.equal(createHash('sha256').update(valeurs.join('\n')).digest('hex'), 'bcbbae16b626176d098ba4a288fcaf8c48cf37e2b53cb84e06f4b0ea3ad72333');
});

test('chaque famille et chaque zone a ses six rôles ; -fill et -on ne changent pas en sombre, les quatre autres sont redéclarés', () => {
  for (const c of TOUTES) {
    for (const r of ROLES) {
      assert.match(clair[`c-${c}${r}`] || '', /^#[0-9a-f]{6}$/, `--c-${c}${r} en clair`);
    }
    for (const r of ['-fill', '-on']) assert.equal(sombreSeul[`c-${c}${r}`], undefined, `--c-${c}${r} redéfini en sombre`);
    for (const r of ['', '-tint', '-tint-2', '-text']) assert.match(sombreSeul[`c-${c}${r}`] || '', /^#[0-9a-f]{6}$/, `--c-${c}${r} en sombre`);
  }
});

test('AA : -on sur -fill, -text sur le fond, les cartes et la teinte ; l\'accent à 3:1 au moins sur le fond', () => {
  for (const [theme, t] of THEMES) {
    for (const c of TOUTES) {
      const v = (r) => t[`c-${c}${r}`];
      assert.ok(contraste(v('-on'), v('-fill')) >= 4.5, `${theme} ${c} : -on sur -fill (${contraste(v('-on'), v('-fill')).toFixed(2)})`);
      for (const fond of [t.bg, t.surface, v('-tint')]) assert.ok(contraste(v('-text'), fond) >= 4.5, `${theme} ${c} : -text sur ${fond}`);
      assert.ok(contraste(v(''), t.bg) >= 3, `${theme} ${c} : accent sur le fond`);
    }
  }
});

// Relecture finale de la v12.1 : les barres de « Tes émotions » (Analyse › Ma semaine) sont posées sur --surface-2. Depuis les
// jetons 3a, en clair, Joie (2,95:1) et Sérénité (3,00:1, 2,998 avant l'arrondi) y passaient sous le 3:1 d'un graphique
// (WCAG 1.4.11). Les jetons des familles sont figés (test précédent) : un liseré au -text de la famille porte le 3:1, comme
// celui des marques de zone. Chaque famille, par --c ou par son liseré, à 3:1 au moins sur --surface-2, en clair et en sombre.
test('v12.1 : chaque barre de « Tes émotions » se voit sur --surface-2 à 3:1 au moins, par sa couleur ou par son liseré au -text de sa famille, en clair et en sombre', () => {
  const ecrans = sansCommentaires(lire(join(RACINE, 'public', 'css', 'ecrans.css')));
  const regle = (sel) => {
    const r = [...ecrans.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => m[1].split(/,(?![^(]*\))/).map((x) => x.replace(/\s+/g, ' ').trim()).includes(sel));
    assert.equal(r.length, 1, sel);
    return r[0][2].replace(/\s+/g, ' ');
  };
  // Les tuiles de Ma semaine sont sur --surface-2 ; leurs barres de famille ont le liseré, d'un pixel quel que soit
  // l'étirement du SVG, sans être coupé à son bord.
  assert.match(regle('.tuiles-semaine .tuile'), /background: var\(--surface-2\);/);
  assert.match(regle('.tuile-emotions .g-emo'), /stroke: var\(--c-text\); stroke-width: 1px; vector-effect: non-scaling-stroke;/);
  assert.match(regle('.tuile-emotions .barre-famille'), /overflow: visible;/);
  for (const [theme, t] of THEMES) {
    for (const f of FAMILLES_ROUE) {
      const [c, lisere] = [t[`c-emo-${f}`], t[`c-emo-${f}-text`]];
      const vu = Math.max(contraste(c, t['surface-2']), contraste(lisere, t['surface-2']));
      assert.ok(vu >= 3, `${theme} ${f} : ${contraste(c, t['surface-2']).toFixed(2)}:1, liseré ${contraste(lisere, t['surface-2']).toFixed(2)}:1`);
      assert.ok(contraste(lisere, t['surface-2']) >= 3, `${theme} ${f} : le liseré seul`);
    }
  }
  // Ce que le liseré corrige : sans lui, deux familles passaient sous 3:1 en clair.
  assert.deepEqual(FAMILLES_ROUE.filter((f) => contraste(clair[`c-emo-${f}`], clair['surface-2']) < 3), ['joie', 'serenite']);
});

// Relecture finale de la v12.1 : ce qui se touche est en pilule (3a), une carte a le rayon des cartes. Quatre éléments touchables
// gardaient l'ancien rayon de 12 (ou 8) à côté de pilules, et une carte le sien : « Ajouter » (un .btn, que sa règle défaisait),
// « En consultation » (.pilule, au rayon 999 des .btn depuis la décision du 16/11 ; 26 à la relecture finale), la loupe
// de l'Historique (un rond de 44, au --contour), les étiquettes du noting (la moitié de leurs 60), la carte des questions d'un
// rendez-vous et la carte « Après coup · TCC » (24).
test('v12.1 : relecture finale, ce qui se touche est en pilule et une carte a 24 : « Ajouter », « En consultation », la loupe, le noting, les questions et « Après coup »', () => {
  const regles = (sel) => REGLES.filter(([x]) => x.split(/,(?![^(]*\))/).map((y) => y.trim()).includes(sel)).map(([, d]) => d);
  const rayon = (sel) => regles(sel).flatMap((d) => [...d.matchAll(/border-radius: ([^;]+);/g)].map((m) => m[1]));
  assert.deepEqual(rayon('.bouton-ajouter'), [], '« Ajouter » prend le rayon de .btn');
  assert.ok(rayon('.btn').includes('999px'));
  assert.deepEqual(rayon('.pilule'), ['999px']);
  assert.deepEqual(rayon('.bouton-loupe'), ['999px']);
  assert.ok(regles('.bouton-loupe').some((d) => d.includes('border: 1px solid var(--contour);')), 'la loupe au --contour');
  assert.deepEqual(rayon('.etiquette-noting'), ['30px']);
  assert.ok(regles('.etiquette-noting').some((d) => d.includes('min-height: 60px;')));
  assert.deepEqual(rayon('.carte-questions'), ['var(--r-carte)']);
  assert.deepEqual(rayon('.ligne-carte.bouton-apres-coup'), ['var(--r-carte)']);
});

test('roue des émotions : 7 familles, dans l\'ordre ; -text lisible aussi sur -tint-2 ; une classe emo-<famille> par famille', () => {
  const ordre = [...TOKENS.matchAll(/--c-emo-([a-z]+):/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(ordre)], FAMILLES_ROUE);
  for (const [theme, t] of THEMES) {
    for (const f of FAMILLES_ROUE) assert.ok(contraste(t[`c-emo-${f}-text`], t[`c-emo-${f}-tint-2`]) >= 4.5, `${theme} ${f} : -text sur -tint-2`);
  }
  const sansCom = sansCommentaires(TOKENS);
  for (const f of FAMILLES_ROUE) {
    const regle = sansCom.match(new RegExp(`\\.emo-${f}\\s*\\{([^}]*)\\}`));
    assert.ok(regle, `.emo-${f}`);
    for (const r of ROLES) assert.ok(regle[1].includes(`--c${r}: var(--c-emo-${f}${r});`), `.emo-${f} : --c${r}`);
  }
});

test('teintes de la roue : rouge, orange, jaune-olive, vert, bleu, violet ; Sérénité turquoise, distincte de Joie et de Surprise', () => {
  // Teinte OKLCH de l'accent clair, par famille : la couleur de la roue.
  const H = Object.fromEntries(FAMILLES_ROUE.map((f) => [f, oklch(clair[`c-emo-${f}`]).H]));
  const entre = (h, a, b) => h >= a && h <= b;
  assert.ok(entre(H.colere, 15, 35), `colère ${H.colere}`);
  assert.ok(entre(H.degout, 40, 65), `dégoût ${H.degout}`);
  assert.ok(entre(H.tristesse, 95, 120), `tristesse ${H.tristesse}`);
  assert.ok(entre(H.joie, 130, 155), `joie ${H.joie}`);
  assert.ok(entre(H.surprise, 235, 265), `surprise ${H.surprise}`);
  assert.ok(entre(H.peur, 285, 315), `peur ${H.peur}`);
  assert.ok(entre(H.serenite, 180, 205), `sérénité ${H.serenite}`);
  // Sérénité se distingue de Joie et de Surprise d'au moins 30° de teinte, en accent comme en plein, dans les deux thèmes.
  for (const [theme, t] of THEMES) {
    for (const r of ['', '-fill', '-text']) {
      for (const autre of ['joie', 'surprise']) {
        const d = ecartTeinte(t[`c-emo-serenite${r}`], t[`c-emo-${autre}${r}`]);
        assert.ok(d >= 30, `${theme} : sérénité${r} et ${autre}${r} à ${d.toFixed(0)}°`);
      }
    }
  }
  // Deux familles voisines de la roue ne se confondent pas : au moins 20° de teinte entre leurs pleins.
  for (let i = 0; i < FAMILLES_ROUE.length; i++) {
    for (let j = i + 1; j < FAMILLES_ROUE.length; j++) {
      const [a, b] = [FAMILLES_ROUE[i], FAMILLES_ROUE[j]];
      assert.ok(ecartTeinte(clair[`c-emo-${a}-fill`], clair[`c-emo-${b}-fill`]) >= 20, `${a} et ${b}`);
    }
  }
});

test('les couleurs de la roue ne servent qu\'aux classes .emo-* (roue et graphiques d\'émotions) : aucune feuille ne les lit directement', () => {
  const fautes = [];
  for (const f of CSS) {
    const code = sansCommentaires(lire(f)).replace(/\.emo-[a-z]+\s*\{[^}]*\}/g, '');
    if (/var\(\s*--c-emo-/.test(code)) fautes.push(rel(f));
  }
  assert.deepEqual(fautes, []);
});

test('teintes locales : chaque classe .emo-* et .zone-* donne les six rôles d\'une seule couleur (v12 : plus de .teinte-*)', () => {
  const sansCom = sansCommentaires(TOKENS);
  const regles = [...sansCom.matchAll(/((?:\.(?:teinte|emo|zone)-[\w-]+\s*,?\s*)+)\{([^}]*)\}/g)];
  assert.equal(regles.length, FAMILLES_ROUE.length + ZONES_ROUE.length);
  for (const [, selecteurs, corps] of regles) {
    const cibles = [...corps.matchAll(/--c([\w-]*):\s*var\(--c-([\w-]+?)\1\);/g)];
    assert.equal(cibles.length, 6, selecteurs);
    assert.equal(new Set(cibles.map((m) => m[2])).size, 1, `${selecteurs} : une seule couleur`);
  }
});

// ---------- v9 · Zones de la carte des émotions (tâche 3) ----------
// Les couleurs médianes des quatre bulles de How We Feel (visuel-hwf.md §1.5, dont les valeurs font foi), lues dans l'annexe.
const VISUEL = lire(join(RACINE, 'docs', 'superpowers', 'specs', '2026-10-28-carnet-v9', 'visuel-hwf.md'));
const NOMS_VISUEL = { rouge: 'Rouge', jaune: 'Jaune', bleu: 'Bleu', vert: 'Vert' };
const MEDIANE = Object.fromEntries(ZONES_ROUE.map((z) => [z, VISUEL.match(new RegExp(`^\\| ${NOMS_VISUEL[z]} \\| (#[0-9a-f]{6}) \\|`, 'm'))[1]]));

test('zones : rouge, jaune, bleu, vert, dans l\'ordre ; -fill est la couleur médiane de la bulle de How We Feel ; en sombre, l\'accent aussi', () => {
  assert.deepEqual(MEDIANE, { rouge: '#fe4c40', jaune: '#ffd04c', bleu: '#789fff', vert: '#4ce39b' });
  const ordre = [...TOKENS.matchAll(/--c-zone-([a-z]+):/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(ordre)], ZONES_ROUE);
  for (const z of ZONES_ROUE) {
    assert.equal(clair[`c-zone-${z}-fill`], MEDIANE[z], `${z} : -fill`);
    // Sur noir, comme chez How We Feel : l'accent du thème sombre est la couleur de la bulle elle-même.
    assert.equal(sombre[`c-zone-${z}`], MEDIANE[z], `${z} : accent en sombre`);
  }
  const sansCom = sansCommentaires(TOKENS);
  for (const z of ZONES_ROUE) {
    const regle = sansCom.match(new RegExp(`\\.zone-${z}\\s*\\{([^}]*)\\}`));
    assert.ok(regle, `.zone-${z}`);
    for (const r of ROLES) assert.ok(regle[1].includes(`--c${r}: var(--c-zone-${z}${r});`), `.zone-${z} : --c${r}`);
  }
});

test('zones : AA de -on sur -fill et de -text sur le fond, les cartes, la surface 2 et les deux teintes ; l\'accent à 3:1 sur le fond et les cartes', () => {
  for (const [theme, t] of THEMES) {
    for (const z of ZONES_ROUE) {
      const v = (r) => t[`c-zone-${z}${r}`];
      assert.ok(contraste(v('-on'), v('-fill')) >= 4.5, `${theme} ${z} : -on sur -fill (${contraste(v('-on'), v('-fill')).toFixed(2)})`);
      for (const [nom, fond] of [['fond', t.bg], ['carte', t.surface], ['surface 2', t['surface-2']], ['teinte', v('-tint')], ['teinte 2', v('-tint-2')]]) {
        assert.ok(contraste(v('-text'), fond) >= 4.5, `${theme} ${z} : -text sur ${nom} (${contraste(v('-text'), fond).toFixed(2)})`);
      }
      // Un point de zone se pose sur le fond (en-tête du jour) ou sur une carte (Ma journée, Historique, Mes jours) : son
      // liseré, à l'accent, y porte le 3:1 (relecture finale ; le test suivant).
      for (const [nom, fond] of [['fond', t.bg], ['carte', t.surface]]) {
        assert.ok(contraste(v(''), fond) >= 3, `${theme} ${z} : accent sur ${nom} (${contraste(v(''), fond).toFixed(2)})`);
      }
    }
  }
});

// Relecture finale : en clair, l'accent assombri pour le 3:1 n'était plus la couleur de How We Feel (le jaune devenait
// olive, voisin de la Tristesse), alors que les bulles de la même carte la gardaient. Une marque de zone (le point d'un
// jour, le rond d'un relevé, un point ou une barre de graphique, un rond de légende) est donc peinte en -fill, la couleur
// des bulles, dans les deux thèmes, et un liseré à l'accent porte le 3:1 sur le fond clair. En sombre, l'accent est
// -fill : le liseré s'y fond.
test('zones : une marque de zone a la couleur des bulles (-fill) et un liseré à l\'accent ; -fill seul n\'a pas le 3:1 en clair', () => {
  const regles = [...sansCommentaires(lire(join(RACINE, 'public', 'css', 'ecrans.css'))).matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .map((m) => [m[1].replace(/\s+/g, ' ').trim(), m[2]]);
  // Les sélecteurs d'une règle, coupés aux virgules hors des parenthèses (celles de :is() restent).
  const selecteurs = (sel) => sel.split(/,(?![^(]*\))/).map((x) => x.trim());
  const decl = (selecteur) => {
    const r = regles.filter(([sel]) => selecteurs(sel).includes(selecteur));
    assert.equal(r.length, 1, selecteur);
    return r[0][1].replace(/\s+/g, ' ');
  };
  const zones = ':is(.zone-rouge, .zone-jaune, .zone-bleu, .zone-vert)';
  for (const sel of ['.zones-jour i', `.point-releve${zones}`]) {
    const d = decl(sel);
    assert.match(d, /background: var\(--c-fill\);/, sel);
    assert.match(d, /box-shadow: inset 0 0 0 1px var\(--c\);/, sel);
  }
  for (const sel of [`.g-emo${zones}`, `${zones} > svg > .g-emo`]) {
    const d = decl(sel);
    assert.match(d, /fill: var\(--c-fill\);/, sel);
    assert.match(d, /stroke: var\(--c\); stroke-width: 1;/, sel);
  }
  // Le jaune des bulles sur le fond clair : sans liseré, il ne se verrait pas assez.
  assert.ok(contraste(clair['c-zone-jaune-fill'], clair.surface) < 3);
  for (const z of ZONES_ROUE) assert.equal(sombre[`c-zone-${z}`], clair[`c-zone-${z}-fill`], `${z} : en sombre, le liseré est la couleur de la bulle`);
});

test('zones : chaque rôle garde la teinte de sa bulle (à 12° près), et les quatre zones restent bien distinctes', () => {
  for (const [theme, t] of THEMES) {
    for (const z of ZONES_ROUE) {
      for (const r of ['', '-text', '-tint', '-tint-2']) {
        const d = ecartTeinte(t[`c-zone-${z}${r}`], MEDIANE[z]);
        assert.ok(d <= 12, `${theme} ${z}${r} : ${d.toFixed(0)}° de la bulle`);
      }
    }
    for (let i = 0; i < ZONES_ROUE.length; i++) {
      for (let j = i + 1; j < ZONES_ROUE.length; j++) {
        const [a, b] = [ZONES_ROUE[i], ZONES_ROUE[j]];
        assert.ok(ecartTeinte(t[`c-zone-${a}`], t[`c-zone-${b}`]) >= 45, `${theme} : ${a} et ${b}`);
      }
    }
  }
});

test('les couleurs de zone ne servent qu\'aux classes .zone-* : aucune feuille ne les lit directement', () => {
  const fautes = [];
  for (const f of CSS) {
    const code = sansCommentaires(lire(f)).replace(/\.zone-[a-z]+\s*\{[^}]*\}/g, '');
    if (/var\(\s*--c-zone-/.test(code)) fautes.push(rel(f));
  }
  assert.deepEqual(fautes, []);
});

// Relecture de la tâche 9 : les règles des classes que l'app ne pose plus disparaissent avec leur composant (Rubrique,
// .ligne-champ d'Aujourd'hui avant les cartes 2b, .filet-tirets).
test('aucune règle pour une classe retirée de l\'app : .rubrique, .rubrique-icone, .rubrique-dessous, .ligne-champ, .filet-tirets', () => {
  const RETIREES = new Set(['rubrique', 'rubrique-icone', 'rubrique-dessous', 'ligne-champ', 'filet-tirets']);
  const fautes = [];
  for (const f of CSS) {
    for (const m of sansCommentaires(lire(f)).matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) if (RETIREES.has(m[1])) fautes.push(`${rel(f)} : .${m[1]}`);
  }
  assert.deepEqual(fautes, []);
});
