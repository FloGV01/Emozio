import { readFileSync } from 'node:fs';
import { test, expect } from '../aides/gardes.js';
import { toucher, groupe, viderBase, aller, appPrete, simulerZonesSures } from '../aides/saisie.js';
import { canaux, contraste, jetons, oklch } from '../aides/couleurs.js';
import { vueMoment, noter, continuer, faisais, mot } from '../aides/emotion.js';
import { stabiliser, verserControle, ciblesPetites, rondsAccent, accentHorsDeSaPlace, liensSurSurface2 } from '../aides/controle.js';
import { installerParole } from '../aides/lecteur.js';

// v12 · Le design simple façon Apple (spec docs/superpowers/specs/2026-11-09-emozio-v12-design.md, §5).
// Tâche 3 : les jetons, l'accent (le vert B en v12, le bleu pétrole en v12.1) et les choix. Un choix fait est un aplat
// d'accent, son texte et sa coche ✓ en --sur-accent, en 600 : la coche reste, dans les deux thèmes (jamais la couleur seule).
// Un choix non fait a le fond --fond-choix (transparent en v12, --surface en v12.1), avec son contour, en pilule depuis la
// v12.1. Rien ne change de taille au toucher. La roue, l'interrupteur et les champs passent au même système. Les
// écrans de l'émotion et « Réveil la nuit » n'ont pas d'accent. Tâche 4 : Aujourd'hui façon Apple (l'en-tête, les cartes sans
// carré coloré, la bande du bas, les onglets), sans couleur de rubrique, et la page du soir qui ne grandit pas de plus de
// 120 px. Tâche 5 : les autres écrans et les graphiques ; l'accent reste à sa place (la règle de forme et le point de
// vigilance 3 sont contrôlés sur tous les écrans du contrôle, v7-controle.spec.js ; ici, leurs contrôles eux-mêmes), les
// graphiques sont à l'encre, une seule action en aplat par vue. v12.1 (spec 2026-11-14, tâche A) : les jetons « 3a » (base
// presque blanche, surfaces teintées de bleu pétrole, accent pétrole), le bandeau d'Aujourd'hui, les rubriques à plat, les
// pilules, le grand titre de 40. Tâche B : plus de ligne sous le titre, le mot choisi de la carte reste un disque. Données
// inventées. Horloge : jeudi 15 octobre 2026, 21:00 (390 × 844).
const { clair, sombre } = jetons(readFileSync(new URL('../../public/css/tokens.css', import.meta.url), 'utf8'));
const THEMES = [['light', clair], ['dark', sombre]];
const rgb = (hex) => `rgb(${canaux(hex).join(', ')})`;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const contourDe = (t) => `${rgb(t.contour)} 0px 0px 0px 1px inset`;
// v12.1 : un gris, ou une teinte de la base pétrole (teinte de 215 à 230°, saturation sous 0,05) : la base et l'encre des
// graphiques, jamais l'accent (0,08 au moins).
const dePetrole = (c) => { const o = oklch(c); return o.C < 0.02 || (o.C < 0.05 && o.H >= 215 && o.H <= 230); };
const NOMS_BASE = ['bg', 'surface', 'surface-2', 'barre', 'line', 'contour', 'text', 'text-2', 'desactive', 'piste', 'fenetre', 'rond',
  'donnee', 'donnee-1', 'donnee-2', 'donnee-3'];

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 9, 15, 21, 0) });
  await page.goto('/');
  await viderBase(page);
});

// Chaque bouton d'un groupe : sa boîte, son style, son rayon vu (999px, celui de la planche, ramené par le navigateur à la
// moitié de la plus petite dimension : une pilule), sa coche (montrée ou non, sa taille, sa couleur) et ce qui bouge.
const choixDe = (loc) => loc.evaluate(async (g) => {
  const rayonVu = (b) => {
    const r = b.getBoundingClientRect();
    return `${Math.min(parseFloat(getComputedStyle(b).borderTopLeftRadius), Math.round(r.width * 2) / 4, Math.round(r.height * 2) / 4)}px`;
  };
  await Promise.all(g.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  return [...g.querySelectorAll('button')].map((b) => {
    const s = getComputedStyle(b);
    const r = b.getBoundingClientRect();
    const coche = b.querySelector(':scope > .coche');
    const svg = coche && coche.querySelector('svg');
    const vue = Boolean(coche) && getComputedStyle(coche).display !== 'none';
    return {
      nom: b.textContent.trim(), presse: b.getAttribute('aria-pressed'), boite: [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 2) / 2),
      fond: s.backgroundColor, texte: s.color, graisse: s.fontWeight, contour: s.boxShadow, transform: s.transform, rayon: rayonVu(b),
      coche: vue && { taille: Math.round(svg.getBoundingClientRect().width), trait: svg.getAttribute('stroke'), couleur: getComputedStyle(svg).color,
        cachee: coche.getAttribute('aria-hidden') },
    };
  });
});

test('v12 (3/9) · un choix fait garde sa coche, en clair et en sombre : un aplat d\'accent, le texte et la coche en --sur-accent, en 600 ; non fait, le fond --surface (v12.1) avec son contour, en pilule ; rien ne change de taille', async ({ page }) => {
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await viderBase(page);
    // Une grille (Lieu), un segmenté (Sommeil), un Oui / Non (Traitement pris).
    for (const [nom, choix] of [['Lieu', 'Congé / repos'], ['Sommeil', 'Bien'], ['Traitement pris', 'Partiel']]) {
      const quoi = `${schema} · ${nom} › ${choix}`;
      const avant = await choixDe(groupe(page, nom));
      for (const b of avant) {
        expect(b.presse, `${quoi} : ${b.nom}`).toBe('false');
        expect([b.fond, b.contour, b.graisse, b.coche], `${quoi} : ${b.nom}, non fait`).toEqual([rgb(t.surface), contourDe(t), '400', false]);
        expect(b.rayon, `${quoi} : ${b.nom}, en pilule`).toBe(`${b.boite[3] / 2}px`);
      }
      await toucher(page, nom, choix);
      const apres = await choixDe(groupe(page, nom));
      const fait = apres.find((b) => b.presse === 'true');
      expect(fait.nom, quoi).toContain(choix);
      expect([fait.fond, fait.texte, fait.graisse, fait.contour], quoi).toEqual([rgb(t.accent), rgb(t['sur-accent']), '600', 'none']);
      // La coche ✓ : au trait, de la couleur du texte, cachée aux lecteurs d'écran (aria-pressed dit l'état).
      expect(fait.coche, quoi).toEqual({ taille: 16, trait: 'currentColor', couleur: rgb(t['sur-accent']), cachee: 'true' });
      expect(contraste(fait.texte, fait.fond), quoi).toBeGreaterThanOrEqual(4.5);
      // Rien ne change de taille ni de place : ni le choix fait, ni ses voisins, et aucun rebond.
      expect(apres.map((b) => b.boite), quoi).toEqual(avant.map((b) => b.boite));
      expect(apres.map((b) => b.transform), quoi).toEqual(apres.map(() => 'none'));
      for (const b of apres.filter((x) => x.presse === 'false')) expect([b.fond, b.coche], `${quoi} : ${b.nom}`).toEqual([rgb(t.surface), false]);
    }
  }
});

test('v12 (3/9) · dans un parcours, un chiffre choisi garde sa coche, en 700, sans rebond : sa boîte ne bouge pas', async ({ page }) => {
  const id = await page.evaluate(async () => (await window.__carnet.repo.episodes.creer({ date: '2026-10-14', heure: '18:42', emotion: 'emotion:colere', intensite: 7 })).id);
  await aller(page, `#/episode/${id}`);
  const fiche = page.getByRole('dialog', { name: 'Épisode' });
  await fiche.getByRole('button', { name: /^Intensité/ }).click();
  const cinq = fiche.getByRole('button', { name: 'Intensité 5' });
  await expect(cinq).toHaveAttribute('aria-pressed', 'false');
  // L'horloge arrêtée : l'étape reste à l'écran après le toucher (le passage à la suite attend un délai).
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 500));
  const avant = await cinq.boundingBox();
  await cinq.click();
  await expect(cinq).toHaveAttribute('aria-pressed', 'true');
  // Juste après le toucher : ni rebond ni agrandissement (seuls le fond et le texte passent en fondu).
  expect(await cinq.evaluate((b) => [b.getAnimations().filter((a) => a.animationName || !['background-color', 'color'].includes(a.transitionProperty)).length,
    getComputedStyle(b).transform])).toEqual([0, 'none']);
  expect(await cinq.boundingBox()).toEqual(avant);
  const s = await cinq.evaluate(async (b) => {
    await Promise.all(b.getAnimations().map((a) => a.finished.catch(() => {})));
    return [getComputedStyle(b).backgroundColor, getComputedStyle(b).fontWeight, getComputedStyle(b.querySelector('.coche')).display !== 'none'];
  });
  expect(s).toEqual([rgb(clair.accent), '700', true]);
});

test('v12 (3/9) · la roue : une piste au contour, une fenêtre neutre, en pilules (v12.1) ; notée, un aplat d\'accent ; les champs, au fond --surface (v12.1) et au contour, un anneau d\'accent au focus, le micro en accent', async ({ page }) => {
  const roue = groupe(page, 'Durée de la nuit');
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    const piste = await roue.evaluate((g) => [getComputedStyle(g).backgroundColor, getComputedStyle(g).boxShadow, getComputedStyle(g, '::before').backgroundColor,
      getComputedStyle(g).borderTopLeftRadius, getComputedStyle(g, '::before').borderTopLeftRadius]);
    expect(piste, schema).toEqual([rgb(t.piste), contourDe(t), rgb(t.fenetre), '999px', '999px']);
    // Le champ des points positifs, au fond --surface et au contour ; au focus, l'anneau d'accent ; le micro en accent.
    const champ = page.locator('#points-positifs');
    expect(await champ.evaluate((c) => [getComputedStyle(c).backgroundColor, getComputedStyle(c).boxShadow]), schema).toEqual([rgb(t.surface), contourDe(t)]);
    await champ.focus();
    expect(await champ.evaluate((c) => [getComputedStyle(c).borderTopColor, getComputedStyle(c).boxShadow]), schema)
      .toEqual([rgb(t.accent), `${rgb(t.accent)} 0px 0px 0px 1px`]);
    const micro = page.locator('.champ-avec-dicter', { has: champ }).getByRole('button', { name: 'Dicter' });
    expect(await micro.evaluate((b) => getComputedStyle(b).color), schema).toBe(rgb(t['accent-texte']));
    await champ.blur();
  }
});

test('v12 (3/9) · l\'interrupteur, comme sur iOS : allumé, un rail d\'accent et un bouton blanc ; éteint, un rail neutre au contour', async ({ page }) => {
  await aller(page, '#/reglages/journee');
  const inter = page.getByRole('switch', { name: 'Afficher Mes gratitudes' });
  await expect(inter).toHaveAttribute('aria-checked', 'true');
  const style = () => inter.evaluate(async (b) => {
    await Promise.all(b.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
    const k = b.querySelector('.interrupteur-bouton');
    return [getComputedStyle(b).backgroundColor, getComputedStyle(b).borderTopColor, getComputedStyle(k).backgroundColor];
  });
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    expect(await style(), `${schema} : allumé`).toEqual([rgb(t.accent), rgb(t.accent), 'rgb(255, 255, 255)']);
    await inter.click();
    await expect(inter).toHaveAttribute('aria-checked', 'false');
    expect(await style(), `${schema} : éteint`).toEqual([rgb(t['surface-2']), rgb(t.contour), rgb(t.contour)]);
    await inter.click();
    await expect(inter).toHaveAttribute('aria-checked', 'true');
  }
});

// Le point de vigilance 3, pour les jetons : l'accent, lu sur l'écran rendu, est l'encre des écrans de l'émotion et le gris
// de la nuit, jamais l'accent de la racine (la tâche 5 lit chaque élément de ces écrans).
test('v12 (3/9) · pas d\'accent sur les écrans de l\'émotion ni sur « Réveil la nuit » : l\'accent y est l\'encre, en clair et en sombre', async ({ page }) => {
  const lire = (loc) => loc.evaluate((e) => ['--accent', '--sur-accent', '--accent-texte', '--action', '--action-on'].map((n) => getComputedStyle(e).getPropertyValue(n).trim().toLowerCase()));
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await aller(page, '#/aujourdhui');
    await aller(page, '#/moment');
    const moment = page.locator('.moment-plein');
    await expect(moment).toBeVisible();
    expect(await lire(moment), schema).toEqual([t['moment-plein'], t['moment-plein-on'], t['moment-plein'], t['moment-plein'], t['moment-plein-on']]);
    await page.getByRole('dialog', { name: 'Émotion du moment' }).getByRole('button', { name: 'Fermer', exact: true }).click();
    await aller(page, '#/aujourdhui');
    await aller(page, '#/crise/reveil-nuit');
    const nuit = page.locator('.parcours.ecran-noir');
    await expect(nuit).toBeVisible();
    expect(await lire(nuit), schema).toEqual(['#8e8f92', '#000000', '#8e8f92', '#8e8f92', '#000000']);
    await nuit.getByRole('button', { name: 'Fermer', exact: true }).click();
  }
});

// Relecture de la tâche 3 : en annulant --contour dans les écrans de l'émotion, la carte « Pour récupérer, je… » de l'écran 3
// perdait le cercle de sa respiration (un rond pâle sur la carte, à 1,16:1) et la forme de « Arrêter » (fond de la carte, sans
// contour : un mot seul). Comme en v11, sans accent : le cercle est cerclé à l'encre, et « Arrêter » a le fond --surface-2.
test('v12 (3/9) · l\'écran 3 de l\'émotion, carte « Pour récupérer, je… » : le cercle de la respiration cerclé à l\'encre (3:1 au moins sur la carte, jamais à l\'accent), « Arrêter » garde sa forme, en clair et en sombre', async ({ page }) => {
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await viderBase(page);
    await page.evaluate(async () => {
      const m = window.__carnet.repo.meta;
      await m.ecrire('monPlan', { quandCaMonte: 'je sors marcher', pourRecuperer: 'je m\'allonge\nje ferme les yeux', siAlors: [] });
      await m.ecrire('ressourcer', { energieBasse: true });
    });
    await aller(page, '#/moment');
    const vue = vueMoment(page);
    await noter(vue, 'bleu', 'Vide');
    await continuer(vue).click();
    await expect(faisais(vue)).toBeVisible();
    const carte = vue.getByRole('region', { name: 'Pour récupérer, je…' });
    await carte.getByRole('button', { name: 'Respirer', exact: true }).click();
    const arreter = carte.getByRole('button', { name: 'Arrêter', exact: true });
    await expect(arreter).toBeVisible();
    const mesure = () => carte.evaluate((c) => {
      const s = (e) => getComputedStyle(e);
      const cercle = c.querySelector('.cercle-respiration span');
      const b = [...c.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Arrêter');
      return { carte: s(c).backgroundColor, bord: [s(cercle).borderTopWidth, s(cercle).borderTopStyle, s(cercle).borderTopColor],
        arreter: b && { fond: s(b).backgroundColor, contour: s(b).boxShadow } };
    });
    const m = await mesure();
    const quoi = `${schema} · respiration en cours`;
    expect(m.carte, quoi).toBe(rgb(t.surface));
    // Le cercle : un bord opaque, à l'encre des écrans de l'émotion (le plein des ronds, comme en v11), lisible sur la carte.
    expect(m.bord, quoi).toEqual(['2px', 'solid', rgb(t['moment-plein'])]);
    expect(contraste(m.bord[2], m.carte), quoi).toBeGreaterThanOrEqual(3);
    expect(m.bord[2], `${quoi} : jamais l'accent`).not.toBe(rgb(t.accent));
    // « Arrêter » : un bouton neutre, au fond --surface-2 dans la carte (sans contour dans ces écrans), comme en v11.
    expect(m.arreter.fond, quoi).not.toBe(m.carte);
    expect(m.arreter.fond, quoi).toBe(rgb(t['surface-2']));
    // Arrêtée : le cercle reste cerclé.
    await arreter.click();
    await expect(carte.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible();
    expect((await mesure()).bord, `${schema} · arrêtée`).toEqual(['2px', 'solid', rgb(t['moment-plein'])]);
  }
});

// ---------- Tâche 4 : Aujourd'hui façon Apple ----------

// La hauteur de la page du soir en v11 (b9870dd, mesurée le 10/11/2026 dans WebKit) : remplie comme le contrôle global
// (verserControle), à 390 × 844, au texte par défaut, sans zones sûres, document.documentElement.scrollHeight.
const HAUTEUR_SOIR_V11 = 1611;
// La même, « Sport en détail » ouvert (v11 f5b6c8b, mesurée le 13/11/2026 de la même façon) : relecture finale, la carte du
// détail n'avait pas été recalibrée comme la paire, et « Autre » passait seul sur une 4e rangée (+157 px).
const HAUTEUR_SOIR_SPORT_V11 = 1915;
// Relecture finale de la v12.1 : entre minuit et 4 h, « Encore jeudi jusqu'à 4 h. » a sa ligne sous le titre (4 + 18 px), que
// la ligne du résumé accueillait sans hauteur de plus jusqu'à la v12.0.1. La page passe alors à 1751 / 2055 px, +140 sur la
// v11, au-delà des +120 de la spec v12 §5.4. Les valeurs 3a du bandeau étant définitives, ce dépassement attend l'utilisateur
// (docs/decisions.md, v12.1.0, « En attente de l'utilisateur ») : le passage de 21:00 garde ses +120 ; celui de 01:30 ne
// tolère que la hauteur de cette ligne en plus, et rien d'autre.
const LIGNE_VEILLE = 22;

test('v12 (4/9) · la page du soir, remplie comme le contrôle, grandit de 120 px au plus depuis la v11 (390 × 844, texte par défaut), en clair et en sombre, « Sport en détail » fermé puis ouvert ; avant 4 h, la seule ligne « Encore jeudi » en plus (réserve de la v12.1)', async ({ page }) => {
  await verserControle(page);
  const soir = {};
  for (const [quand, heure, veille] of [['21:00', new Date(2026, 9, 15, 21, 0), 0], ['01:30', new Date(2026, 9, 16, 1, 30), LIGNE_VEILLE]]) {
    await page.clock.setSystemTime(heure);
    for (const [schema] of THEMES) {
      await page.emulateMedia({ colorScheme: schema });
      await page.reload();
      // Tout ce que la page montre ce soir-là : les trois relevés, la ligne Après coup et le prochain rendez-vous.
      await expect(page.locator('.liste-evenements > li')).toHaveCount(3);
      await expect(page.locator('.ligne-apres-coup-jour')).toBeVisible();
      await expect(page.locator('.ligne-rdv')).toBeVisible();
      await stabiliser(page);
      // Avant 4 h, la ligne est là, et sa hauteur est celle qu'on tolère en plus.
      await expect(page.locator('.entete-jour .sous-jour')).toHaveCount(veille ? 1 : 0);
      if (veille) {
        expect(await page.locator('.entete-jour .sous-jour').evaluate((e) => Math.round(e.getBoundingClientRect().height + parseFloat(getComputedStyle(e).marginTop))), `${schema} · ${quand}`).toBe(LIGNE_VEILLE);
      }
      const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(hauteur - HAUTEUR_SOIR_V11, `${schema} · ${quand} : ${hauteur} px, contre ${HAUTEUR_SOIR_V11} en v11`).toBeLessThanOrEqual(120 + veille);
      if (veille) expect(hauteur - soir[`${schema} fermée`], `${schema} · ${quand} : rien d'autre ne grandit`).toBe(veille);
      soir[`${schema} fermée`] = hauteur;
      // « Sport en détail » ouvert (il remplit « tout ») : les 7 types d'activité tiennent sur 3 rangées, comme en v11.
      await page.getByRole('button', { name: 'Sport en détail', exact: true }).click();
      const types = groupe(page, 'Activité 1 : type');
      await expect(types.getByRole('button')).toHaveCount(7);
      await stabiliser(page);
      const rangees = await types.evaluate((g) => new Set([...g.querySelectorAll('button')].map((b) => Math.round(b.getBoundingClientRect().top))).size);
      expect(rangees, `${schema} : les types d'activité`).toBe(3);
      const ouverte = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(ouverte - HAUTEUR_SOIR_SPORT_V11, `${schema} · ${quand}, Sport en détail : ${ouverte} px, contre ${HAUTEUR_SOIR_SPORT_V11} en v11`).toBeLessThanOrEqual(120 + veille);
      if (veille) expect(ouverte - soir[`${schema} ouverte`], `${schema} · ${quand}, Sport en détail : rien d'autre ne grandit`).toBe(veille);
      soir[`${schema} ouverte`] = ouverte;
    }
  }
});

// toHaveAccessibleName calcule le nom à la façon de Playwright, sans text-transform : il lirait « Jeudi 15 octobre » même si
// le navigateur exposait les capitales du sur-titre, comme Chromium (« Aujourd'hui, JEUDI 15 OCTOBRE », relecture de la
// tâche 4). Le nom est donc posé en toutes lettres par l'aria-label du h1, et le test le lit aussi : il est en casse normale,
// alors que le sur-titre s'affiche en capitales.
test('v12 (4/9) · le nom accessible de l\'en-tête ne change pas : « Aujourd\'hui, Jeudi 15 octobre », après minuit aussi, et « Mercredi 14 octobre » un autre jour, ouvert aussi depuis l\'Historique ; l\'aria-label du h1 le donne, en casse normale', async ({ page }) => {
  const titre = page.getByRole('heading', { level: 1 });
  const nomPose = async (nom) => {
    await expect(titre).toHaveAccessibleName(nom);
    await expect(titre).toHaveAttribute('aria-label', nom);
    expect(await titre.locator('.sur-titre').evaluate((e) => getComputedStyle(e).textTransform), nom).toBe('uppercase');
  };
  await nomPose('Aujourd\'hui, Jeudi 15 octobre');
  await expect(titre.locator('.grand-titre')).toHaveText('Aujourd\'hui, ');
  await expect(titre.locator('.sur-titre')).toHaveText('Jeudi 15 octobre');
  // Le grand titre est dessous à l'écran, mais d'abord dans le DOM : le texte se lit dans l'ordre du nom.
  expect(await titre.evaluate((h) => [...h.children].map((e) => e.className))).toEqual(['grand-titre', 'sur-titre']);
  await aller(page, '#/jour/2026-10-14');
  await nomPose('Mercredi 14 octobre');
  await expect(titre.locator('.grand-titre')).toHaveText('Mercredi 14');
  await expect(titre.locator('.sur-titre')).toHaveText('octobre');
  // Le 1er du mois.
  await aller(page, '#/jour/2026-10-01');
  await nomPose('Jeudi 1er octobre');
  await aller(page, '#/historique/jour/2026-10-14');
  await expect(page.getByRole('button', { name: 'Retour' })).toBeVisible();
  await nomPose('Mercredi 14 octobre');
  // Entre 0 h et 4 h, c'est encore jeudi.
  await page.clock.setSystemTime(new Date(2026, 9, 16, 1, 30));
  await aller(page, '#/aujourdhui');
  await page.reload();
  await nomPose('Aujourd\'hui, Jeudi 15 octobre');
});

// La couleur ne dit qu'une émotion (spec §5.1 et §5.6) : sur Aujourd'hui, bande du bas et onglets compris, chaque couleur
// peinte (texte, fond, bord, ombre, remplissage et trait d'une icône) est un gris, une couleur de la base (v12.1 : teintée de
// pétrole, les jetons eux-mêmes), ou l'accent (choisi, agir, onglet actif, liens). Seuls les repères des émotions (.zone-*,
// les points du jour) ont leur couleur.
test('v12 (4/9) · aucune couleur de rubrique sur Aujourd\'hui : hors des zones des émotions, chaque couleur peinte est un gris, une couleur de la base ou l\'accent, en clair et en sombre', async ({ page }) => {
  await verserControle(page);
  await page.evaluate(async () => {
    const r = window.__carnet.repo;
    await r.episodes.creer({ date: '2026-10-15', heure: '18:40', emotion: 'emotion:colere', intensite: 6 });
    await r.symptomes.creer({ date: '2026-10-15', symptome: 'symptome:ruminations', intensite: 4 });
  });
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await page.reload();
    await expect(page.locator('.liste-evenements > li')).toHaveCount(5);
    // Des choix faits (Lieu, Sommeil, Traitement, la roue de la nuit), un détail ouvert, un repli ouvert.
    await toucher(page, 'Contact humain', 'Oui');
    await page.getByRole('button', { name: 'Sport en détail' }).click();
    await page.getByRole('button', { name: /^Ce qui a pesé/ }).click();
    await stabiliser(page);
    const peintes = await page.evaluate(() => {
      const res = [];
      const nom = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}`;
      for (const racine of [document.querySelector('main.aujourdhui'), document.querySelector('nav.onglets')]) {
        for (const el of [racine, ...racine.querySelectorAll('*')]) {
          if (el.closest('.zones-jour, .zone-rouge, .zone-jaune, .zone-bleu, .zone-vert')) continue;
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') continue;
          const r = el.getBoundingClientRect();
          if (!r.width && !r.height) continue;
          const couleurs = [['color', s.color], ['background', s.backgroundColor], ['fill', s.fill], ['stroke', s.stroke],
            ...['Top', 'Right', 'Bottom', 'Left'].filter((c) => s[`border${c}Width`] !== '0px' && s[`border${c}Style`] !== 'none').map((c) => [`border-${c}`, s[`border${c}Color`]]),
            ...(s.boxShadow.match(/rgba?\([^)]*\)/g) || []).map((c) => ['box-shadow', c])];
          for (const [prop, c] of couleurs) if (/^rgba?\(/.test(c)) res.push([nom(el), prop, c]);
        }
      }
      return res;
    });
    const accent = new Set([rgb(t.accent), rgb(t['sur-accent']), rgb(t['accent-texte'])]);
    const base = new Set(NOMS_BASE.map((n) => rgb(t[n])));
    const alpha = (c) => { const m = c.match(/[\d.]+/g); return m.length > 3 ? Number(m[3]) : 1; };
    const fautes = peintes.filter(([, , c]) => alpha(c) > 0 && oklch(c).C >= 0.02 && !accent.has(`rgb(${canaux(c).join(', ')})`) && !base.has(`rgb(${canaux(c).join(', ')})`));
    expect(fautes, schema).toEqual([]);
    // L'accent sert bien : un choix fait, l'onglet actif, Émotion.
    expect(peintes.some(([n, p, c]) => n.startsWith('a.action-bande.moment') && p === 'background' && c === rgb(t.accent)), schema).toBe(true);
    expect(peintes.some(([n, p, c]) => n === 'a.onglet' && p === 'color' && c === rgb(t['accent-texte'])), schema).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
});

// Le point de vigilance 4, pour Aujourd'hui : en très grand texte, le grand titre est plafonné à 48 px ; l'en-tête, la bande
// du bas et « Congé / repos » choisi, avec sa coche, ne débordent pas de côté (rien hors de l'écran, aucun texte hors de sa
// boîte, sauf l'ellipse voulue d'« Émotion » et du résumé). Relecture de la tâche 4 : aujourd'hui et deux jours passés
// (« Mercredi 14 » sous OCTOBRE, « Mercredi 30 » sous SEPTEMBRE, les plus longs), de 17 à 53 px, AX2 (33) et AX4 (47)
// compris : ‹ et › restent ensemble, sur la même rangée, › à droite de ‹ et contre le bord droit (chacun à part, › passait
// seul à la ligne, à gauche sous le titre) ; chaque action de la bande garde une cible de 44 sur 44 (« Moment difficile »
// réduit à son icône ne faisait que 40 de large) ; « nuit dernière » ne sort pas de sa carte, et la page ne défile pas de
// côté jusqu'à 40 px (au-delà, « Télétravail », d'un seul mot, déborde déjà en v11).
test('v12 (4/9) · point de vigilance 4 : en très grand texte (17 à 53, 390 et 375, aujourd\'hui et deux jours passés), le grand titre plafonné à 48 px ; l\'en-tête, la bande et « Congé / repos » avec sa coche ne débordent pas de côté ; ‹ et › restent ensemble à droite ; les actions de la bande gardent 44 de large', async ({ page }) => {
  const titre = page.getByRole('heading', { level: 1 });
  for (const [jour, nom] of [[null, 'Aujourd\'hui, Jeudi 15 octobre'], ['2026-10-14', 'Mercredi 14 octobre'], ['2026-09-30', 'Mercredi 30 septembre']]) {
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.body.style.fontSize = ''; });
    await page.setViewportSize({ width: 390, height: 844 });
    if (jour) await aller(page, `#/jour/${jour}`);
    await expect(titre).toHaveAccessibleName(nom);
    await toucher(page, 'Lieu', 'Congé / repos');
    await expect(groupe(page, 'Lieu').getByRole('button', { name: /Congé \/ repos/ })).toHaveAttribute('aria-pressed', 'true');
    for (const largeur of [390, 375]) {
      await page.setViewportSize({ width: largeur, height: 844 });
      for (const px of [17, 23, 25, 28, 33, 36, 40, 47, 53]) {
        await page.evaluate((x) => { document.documentElement.style.fontSize = `${x}px`; document.body.style.fontSize = `${x}px`; window.scrollTo(0, 0); }, px);
        const quoi = `${jour || 'aujourd\'hui'} · ${largeur} · ${px} px`;
        const m = await page.evaluate(() => {
          const fautes = [];
          const coupe = (el) => getComputedStyle(el).textOverflow === 'ellipsis';
          const verifier = (el, boite) => {
            const r = el.getBoundingClientRect();
            if (!r.width) return;
            if (r.left < -0.5 || r.right > innerWidth + 0.5) fautes.push(`${el.className || el.tagName} hors de l'écran`);
            if (boite && (r.left < boite.left - 0.5 || r.right > boite.right + 0.5)) fautes.push(`${el.className || el.tagName} hors de sa boîte`);
            // Un texte qui dépasse de sa boîte (un élément qui porte du texte ; la cible de ‹ ›, qui déborde exprès de 4 px sur la
            // marge, n'en est pas un).
            const texte = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
            if (texte && el.scrollWidth > el.clientWidth + 1 && !coupe(el)) fautes.push(`${el.className || el.tagName} : texte qui déborde`);
          };
          // La région annoncée de l'en-tête (« Enregistré », v12.1) est masquée à l'écran, dans une boîte de 1 px : son texte
          // en déborde exprès, comme celui de tout .visuellement-cache.
          for (const el of document.querySelectorAll('.entete-jour, .entete-jour *, .actions-flottantes, .actions-flottantes *')) if ((!(el instanceof SVGElement) || el.tagName === 'svg') && el.tagName !== 'INPUT' && !el.closest('.visuellement-cache')) verifier(el);
          const conge = [...document.querySelectorAll('[aria-label="Lieu"] button')].find((b) => b.textContent.includes('Congé'));
          const carte = conge.closest('.carte-champ').getBoundingClientRect();
          for (const el of [conge, ...conge.querySelectorAll('*')]) if (!(el instanceof SVGElement) || el.tagName === 'svg') verifier(el, carte);
          const sous = document.querySelector('.rubrique-sous');
          verifier(sous, sous.closest('.carte-champ').getBoundingClientRect());
          const coche = conge.querySelector('.coche');
          const rayon = [Number.parseFloat(getComputedStyle(conge).borderTopLeftRadius), conge.getBoundingClientRect().height];
          const [prec, suiv] = [...document.querySelectorAll('.nav-jour')].map((b) => b.getBoundingClientRect());
          const ligne = document.querySelector('.ligne-jour').getBoundingClientRect();
          return { fautes, grand: Number.parseFloat(getComputedStyle(document.querySelector('.grand-titre')).fontSize),
            coche: Boolean(coche) && getComputedStyle(coche).display !== 'none', rayon,
            navs: { rangee: Math.abs(prec.top - suiv.top) < 0.5, ordre: suiv.left >= prec.right - 0.5, bord: Math.abs(suiv.right - ligne.right) < 0.5 },
            actions: [...document.querySelectorAll('.actions-flottantes > a')].map((a) => [a.getAttribute('aria-label') || a.textContent.trim(),
              Math.round(a.getBoundingClientRect().width), Math.round(a.getBoundingClientRect().height)]),
            deCote: document.documentElement.scrollWidth > innerWidth };
        });
        expect(m.fautes, quoi).toEqual([]);
        expect(m.grand, quoi).toBeCloseTo(Math.min(2.35 * px, 48), 1);
        expect(m.coche, `${quoi} : la coche de « Congé / repos »`).toBe(true);
        // Son rayon est celui de la planche, 999, à toute taille (décision de l'utilisateur du 16/11 ; 26 depuis la relecture de
        // la tâche A jusque-là) : passée sur deux lignes, « Congé / repos » est un ovale, dont le bord touche le libellé dès
        // 40 px, et coupe l'« é » et le « s » à 47 et à 53 px, un défaut accepté (docs/decisions.md, v12.1.0). Le texte ne sort
        // pas de la boîte de la pastille, ni la pastille de sa rubrique (fautes, plus haut).
        expect(m.rayon[0], `${quoi} : le rayon de « Congé / repos » (${m.rayon[1]} de haut)`).toBe(999);
        expect(m.navs, `${quoi} : ‹ et › ensemble, à droite`).toEqual({ rangee: true, ordre: true, bord: true });
        // Un jour passé n'a pas d'Émotion : « Moment difficile » et « + Épisode ».
        expect(m.actions.length, quoi).toBe(jour ? 2 : 3);
        for (const [action, large, haut] of m.actions) expect(large >= 44 && haut >= 44, `${quoi} : « ${action} », ${large} × ${haut}, une cible de 44 sur 44`).toBe(true);
        // Ce qu'un doigt de 44 pt touche vraiment : chaque action de la bande, tout entière.
        expect(await ciblesPetites(page, '.actions-flottantes'), quoi).toEqual([]);
        if (px <= 40) expect(m.deCote, `${quoi} : la page ne défile pas de côté`).toBe(false);
      }
    }
  }
});


// ---------- v12.1 (tâche A) : les formes « 3a » (docs/design/retour-claude-design-v3/formes-3a.css) ----------

// Aujourd'hui, avec les zones sûres de l'iPhone (47 en haut) : l'en-tête est un bandeau --surface, bord à bord et jusqu'en haut
// de l'écran (sa marge intérieure du haut, la zone sûre + 10), coins du bas à 30 ; la date en capsule --bg, en pilule ; le grand
// titre en 40/47, 700. Les rubriques sont à plat (ni fond ni rayon, rien sur les côtés), un filet --line au-dessus, sauf la
// première sous le bandeau ; leur titre en 700. Une carte (les replis) a le rayon 24 ; la bande du bas, ses boutons en pilule.
// Avec « ‹ Retour », puis sous le bandeau « Nouvelle version prête », le bandeau tient : bord à bord, sous la barre ou le bandeau.
test('v12.1 (A) · Aujourd\'hui : l\'en-tête en bandeau bord à bord jusqu\'en haut, la date en capsule, le grand titre de 40, les rubriques à plat séparées d\'un filet, les cartes de 24, la bande en pilules ; avec « ‹ Retour » et sous « Nouvelle version prête », en clair et en sombre', async ({ page }) => {
  await simulerZonesSures(page);
  await verserControle(page);
  const mesure = () => page.evaluate(() => {
    const s = (e, p) => getComputedStyle(e, p);
    const rayons = (e) => ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((c) => s(e)[`border${c}Radius`]).join(' ');
    const entete = document.querySelector('.entete-jour');
    const r = entete.getBoundingClientRect();
    const sur = document.querySelector('.sur-titre');
    const grand = document.querySelector('.grand-titre');
    const rubriques = [...document.querySelectorAll('.aujourdhui .carte-champ')].map((c) => {
      const b = c.getBoundingClientRect();
      return { fond: s(c).backgroundColor, rayon: rayons(c), filet: s(c).boxShadow, padding: [s(c).paddingTop, s(c).paddingRight, s(c).paddingBottom, s(c).paddingLeft].join(' '),
        gauche: Math.round(b.left), droite: Math.round(b.right), titre: s(c.querySelector('.titre-rubrique')).fontWeight };
    });
    const bandeau = document.querySelector('.bandeau');
    return {
      fond: s(entete).backgroundColor, rayon: rayons(entete), boite: [r.left, r.right, Math.round(r.top)], largeur: innerWidth,
      paddingHaut: s(entete).paddingTop, sousBandeau: bandeau ? Math.round(bandeau.getBoundingClientRect().bottom) : 0,
      // L'interlettrage, en em de sa taille (.03em de 13 px, --t-note). Le rayon : 999, celui de la planche (la moitié de sa
      // hauteur d'une ligne de la relecture finale au 16/11 ; plus bas, la capsule sur deux lignes).
      capsule: [s(sur).backgroundColor, s(sur).borderTopLeftRadius, s(sur).paddingTop, s(sur).paddingLeft,
        (parseFloat(s(sur).letterSpacing) / parseFloat(s(sur).fontSize)).toFixed(3)],
      grand: [Math.round(parseFloat(s(grand).fontSize) * 100) / 100, Math.round(parseFloat(s(grand).lineHeight) * 100) / 100, s(grand).fontWeight],
      rubriques, premiere: document.querySelector('.entete-jour + .carte-champ') === document.querySelector('.aujourdhui .carte-champ'),
      carte: s(document.querySelector('.replis.carte')).borderTopLeftRadius,
      bande: [...document.querySelectorAll('.actions-flottantes > a')].map((a) => s(a).borderTopLeftRadius),
    };
  });
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    for (const [cas, aller_, bandeauMaj] of [['aujourd\'hui', '#/aujourdhui', false], ['« ‹ Retour »', '#/historique/jour/2026-10-14', false], ['« ‹ Retour » et « Nouvelle version prête »', '#/historique/jour/2026-10-14', true]]) {
      await page.reload();
      await appPrete(page);
      if (bandeauMaj) await page.evaluate(() => window.__carnet.etatApp.maj({ majDisponible: true }));
      await aller(page, '#/aujourdhui');
      await aller(page, aller_);
      if (aller_ !== '#/aujourdhui') await expect(page.locator('.entete-jour .barre-retour')).toBeVisible();
      if (bandeauMaj) await expect(page.locator('.bandeau')).toBeVisible();
      await expect(page.locator('.aujourdhui .ligne-rdv, .aujourdhui .ligne-evenement').first()).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      await stabiliser(page);
      const m = await mesure();
      const quoi = `${schema} · ${cas}`;
      expect([m.fond, m.rayon], quoi).toEqual([rgb(t.surface), '0px 0px 30px 30px']);
      // Bord à bord, et jusqu'en haut de l'écran (sous le bandeau « Nouvelle version prête », qui prend la zone sûre).
      expect(m.boite, quoi).toEqual([0, m.largeur, m.sousBandeau]);
      expect(m.paddingHaut, quoi).toBe(bandeauMaj ? '10px' : '57px');
      expect(m.capsule, quoi).toEqual([rgb(t.bg), '999px', '5px', '12px', '0.030']);
      // 2,35 rem et 2,75 rem de 17 px : 40 / 47 (le grand titre de 3a ; 34 / 41 en v12).
      expect(m.grand, quoi).toEqual([39.95, 46.75, '700']);
      // Les rubriques : à plat, rien sur les côtés (de la marge de 16 au bord droit moins 16), un filet au-dessus sauf la première.
      expect(m.rubriques.length, quoi).toBeGreaterThan(4);
      for (const [i, x] of m.rubriques.entries()) {
        const premiere = i === 0 && m.premiere;
        expect([x.fond, x.rayon, x.titre], `${quoi} · rubrique ${i + 1}`).toEqual([TRANSPARENT, '0px 0px 0px 0px', '700']);
        expect(x.filet, `${quoi} · rubrique ${i + 1}`).toBe(premiere ? 'none' : `${rgb(t.line)} 0px -1px 0px 0px`);
        expect(x.padding, `${quoi} · rubrique ${i + 1}`).toBe(premiere ? '6px 0px 8px 0px' : '14px 0px 8px 0px');
        expect(x.gauche >= 16 && x.droite <= m.largeur - 16, `${quoi} · rubrique ${i + 1} dans les marges`).toBe(true);
      }
      expect(m.premiere, `${quoi} : la première rubrique suit le bandeau`).toBe(aller_ === '#/aujourdhui');
      expect(m.carte, quoi).toBe('24px');
      expect(m.bande.length, quoi).toBeGreaterThan(1);
      expect(m.bande.every((x) => x === '999px'), `${quoi} : la bande en pilules`).toBe(true);
    }
  }
});

// La capsule de la date en très grand texte (relecture finale de la v12.1, puis décision de l'utilisateur du 16/11 : les formes
// de la planche, à la lettre) : au rayon 999, à toute taille. Sur une ligne (17 px), une pilule, dont aucune lettre ne sort. Sur
// deux lignes (47 et 53 px, le lundi 16 novembre, le plus long), un ovale : son bord arrondi touche les lettres droites qui
// ouvrent et ferment ses lignes (le « L » de LUNDI, le « N » de NOVEMBRE), un défaut accepté de la planche (docs/decisions.md,
// v12.1.0), noté dans les annotations du test ; les lignes restent dans la boîte de la capsule, et la capsule dans le bandeau et
// dans l'écran. À 390 et à 375, en clair et en sombre.
test('v12.1 · la capsule de la date en très grand texte (lundi 16 novembre) : au rayon 999 de la planche, une pilule sur une ligne, dont aucune lettre ne sort ; un ovale sur deux lignes, dans le bandeau', async ({ page }) => {
  await page.clock.setSystemTime(new Date(2026, 10, 16, 21, 0));
  await page.reload();
  await appPrete(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Aujourd\'hui, Lundi 16 novembre');
  const capsule = () => page.evaluate(() => {
    const c = document.querySelector('.sur-titre');
    const r = c.getBoundingClientRect();
    const b = c.closest('.entete-jour').getBoundingClientRect();
    const s = getComputedStyle(c);
    const rayon = Math.min(parseFloat(s.borderTopLeftRadius), r.width / 2, r.height / 2);
    const taille = parseFloat(s.fontSize);
    // Un point est dans la forme arrondie s'il est à moins du rayon du centre du coin le plus proche.
    const hors = (x, y) => {
      const [cx, cy] = [Math.min(Math.max(x, r.left + rayon), r.right - rayon), Math.min(Math.max(y, r.top + rayon), r.bottom - rayon)];
      return Math.hypot(x - cx, y - cy) - rayon;
    };
    const sorties = [];
    const horsBoite = [];
    const marcheur = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
      const plage = document.createRange();
      plage.selectNodeContents(n);
      for (const q of plage.getClientRects()) {
        if (!q.width) continue;
        if (q.left < r.left - 0.5 || q.right > r.right + 0.5) horsBoite.push(n.textContent.trim());
        const m = (q.height - taille) / 2;
        for (const [x, y] of [[q.left, q.top + m], [q.right, q.top + m], [q.left, q.bottom - m], [q.right, q.bottom - m]]) {
          if (hors(x, y) > 0) sorties.push(`« ${n.textContent.trim()} » de ${hors(x, y).toFixed(1)} px`);
        }
      }
    }
    return { lignes: Math.round((r.height - 10) / parseFloat(s.lineHeight)), rayonCss: s.borderTopLeftRadius, rayon, demi: r.height / 2, sorties, horsBoite,
      dansBandeau: r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5 && r.right <= innerWidth + 0.5 };
  });
  for (const [schema] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    for (const largeur of [390, 375]) {
      await page.setViewportSize({ width: largeur, height: 844 });
      for (const px of [17, 47, 53]) {
        await page.evaluate((x) => { document.documentElement.style.fontSize = `${x}px`; document.body.style.fontSize = `${x}px`; window.scrollTo(0, 0); }, px);
        await stabiliser(page);
        const m = await capsule();
        const quoi = `${schema} · ${largeur} · ${px} px`;
        expect(m.lignes, quoi).toBe(px === 17 ? 1 : 2);
        expect(m.rayonCss, quoi).toBe('999px');
        expect(Math.abs(m.rayon - m.demi), `${quoi} : une pilule, ou un ovale`).toBeLessThan(0.5);
        expect(m.horsBoite, `${quoi} : les lignes dans la boîte de la capsule`).toEqual([]);
        expect(m.dansBandeau, `${quoi} : la capsule dans le bandeau`).toBe(true);
        if (px === 17) expect(m.sorties, quoi).toEqual([]);
        else if (m.sorties.length) test.info().annotations.push({ type: 'défaut accepté (planche)', description: `${quoi} : ${m.sorties.join(', ')}` });
      }
    }
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; document.body.style.fontSize = ''; });
  await page.setViewportSize({ width: 390, height: 844 });
});

// Moment difficile : les exercices courts en pilules teintées ; la respiration dans un bandeau --surface bord à bord, rayon 34,
// marges 18 × 32, son cercle de 176 et « Commencer » en pilule sur toute la largeur ; « Une chose à la fois » et « Mon plan »
// sans fond, au contour --line, rayon 24.
test('v12.1 (A) · Moment difficile : les exercices en pilules, la respiration en bandeau bord à bord et « Commencer » sur toute sa largeur, « Une chose à la fois » et « Mon plan » au contour, en clair et en sombre', async ({ page }) => {
  await verserControle(page);
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await aller(page, '#/aujourdhui');
    await aller(page, '#/moment-difficile');
    const vue = page.getByRole('dialog', { name: 'Moment difficile' });
    await expect(vue.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible();
    // Mon plan se lit en base après l'ouverture : il n'était pas toujours là quand la mesure partait (relecture finale, un
    // passage en sombre de la suite complète n'en a vu qu'un des deux).
    await expect(vue.locator('.une-chose-acces, .plan-moment')).toHaveCount(2);
    const m = await vue.evaluate((v) => {
      const s = (e) => getComputedStyle(e);
      const resp = v.querySelector('.carte-respiration');
      const r = resp.getBoundingClientRect();
      const commencer = [...resp.querySelectorAll('.btn')].find((b) => b.textContent.trim() === 'Commencer');
      const [c, i] = [commencer.getBoundingClientRect(), resp.querySelector('.respiration').getBoundingClientRect()];
      return {
        exercices: [...v.querySelectorAll('.exercice-court')].map((e) => [s(e).backgroundColor, s(e).borderTopLeftRadius, s(e).boxShadow]),
        respiration: [s(resp).backgroundColor, s(resp).borderTopLeftRadius, s(resp).paddingTop, s(resp).paddingLeft, Math.round(r.left), Math.round(r.right), innerWidth],
        cercle: Math.round(resp.querySelector('.cercle-respiration').getBoundingClientRect().width),
        commencer: [s(commencer).borderTopLeftRadius, Math.round(c.left - i.left), Math.round(i.right - c.right)],
        contours: [...v.querySelectorAll('.une-chose-acces, .plan-moment')].map((e) => [s(e).backgroundColor, s(e).borderTopLeftRadius, s(e).boxShadow]),
      };
    });
    expect(m.exercices.length, schema).toBe(4);
    for (const e of m.exercices) expect(e, schema).toEqual([rgb(t.surface), '999px', contourDe(t)]);
    expect(m.respiration, schema).toEqual([rgb(t.surface), '34px', '18px', '32px', 0, m.respiration[6], m.respiration[6]]);
    expect(m.cercle, schema).toBe(176);
    expect(m.commencer, schema).toEqual(['999px', 0, 0]);
    expect(m.contours.length, schema).toBe(2);
    for (const e of m.contours) expect(e, schema).toEqual([TRANSPARENT, '24px', `${rgb(t.line)} 0px 0px 0px 1px inset`]);
    await vue.getByRole('button', { name: 'Fermer', exact: true }).click();
  }
});

// ---------- v12.1 (tâche B) : plus de ligne sous le titre, le mot choisi reste un disque (spec v12.1 §2 et §3.3) ----------

// Spec §2 point 2 : sous « Aujourd'hui », ni les points des zones, ni le résumé de la journée, ni « Enregistré » à l'écran :
// le bandeau finit 18 sous le titre. « Enregistré » reste annoncé, par la région role="status" de l'en-tête, masquée
// (.visuellement-cache). Un échec d'écriture devient, dans cette même région, une ligne visible sous le titre, en --text ;
// la panne passée, « Enregistré » est de nouveau seulement annoncé. Avant 4 h, « Encore jeudi jusqu'à 4 h. » seul.
// Relecture finale : quand le message paraît (deux lignes, 40 px) puis repart, rien ne bouge sous le doigt (la page défile
// d'autant, entete-jour.js) : avant, toute la page descendait de 40 px puis remontait, pendant le toucher suivant, qui
// écrivait la valeur de la rangée du dessus. En haut de la page, défilée de 600 px, et avant 4 h (le message remplace alors
// « Encore jeudi », 18 px de plus).
test('v12.1 (B) · sous le titre d\'Aujourd\'hui, plus de ligne : ni points des zones, ni résumé, ni « Enregistré » à l\'écran ; « Enregistré » annoncé, masqué ; un échec d\'écriture se lit ; avant 4 h, « Encore jeudi jusqu\'à 4 h. », en clair et en sombre', async ({ page }) => {
  await verserControle(page);
  const entete = page.locator('.entete-jour');
  const annonce = entete.locator('[role="status"]');
  const ECHEC = 'Enregistrement impossible pour l\'instant, nouvel essai en cours.';
  const premiere = () => page.locator('.carte-champ').first().evaluate((c) => Math.round(c.getBoundingClientRect().top));
  // Les écritures du journal échouent tant que window.__panne est vrai (posé ici à vrai).
  const installerPanne = () => page.evaluate(() => {
    const j = window.__carnet.repo.journal;
    const vrai = j.patch;
    window.__panne = true;
    j.patch = (...a) => (window.__panne ? Promise.reject(new Error('panne d\'essai')) : vrai.apply(j, a));
  });
  // Ce que l'en-tête montre sous sa ligne de titre : sa hauteur, et les textes visibles qui y sont peints.
  const dessous = () => entete.evaluate((e) => {
    const ligne = e.querySelector('.ligne-jour').getBoundingClientRect();
    const textes = [...e.querySelectorAll('*')].filter((x) => !x.closest('.ligne-jour, .barre-retour, .visuellement-cache')
      && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && x.getClientRects().length).map((x) => x.textContent.trim());
    return { hauteur: Math.round(e.getBoundingClientRect().bottom - ligne.bottom), textes };
  });
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await page.reload();
    // Ce soir-là, Bureau, une nuit, trois relevés de deux zones : de quoi faire un résumé et des points, jusqu'à la v12.
    await expect(page.locator('.liste-evenements > li')).toHaveCount(3);
    await expect(entete.locator('.zones-jour, .sous-jour')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /^Émotions/ })).toHaveCount(0);
    expect(await dessous(), schema).toEqual({ hauteur: 18, textes: [] });
    await expect(annonce).toHaveAttribute('aria-live', 'polite');
    await expect(annonce).toHaveClass('visuellement-cache');
    await expect(annonce).toHaveText('');
    // Un toucher : « Enregistré » annoncé, rien à l'écran, rien ne bouge.
    const avant = await premiere();
    await toucher(page, 'Lieu', 'Télétravail');
    await expect(annonce).toHaveText('Enregistré');
    await expect(annonce).toHaveClass('visuellement-cache');
    expect(await annonce.evaluate((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }), schema).toEqual([1, 1]);
    expect(await dessous(), schema).toEqual({ hauteur: 18, textes: [] });
    expect(await premiere(), schema).toBe(avant);
    // Une panne d'écriture : le message, visible sous le titre, dans le bandeau, en --text, et toujours annoncé.
    await installerPanne();
    await toucher(page, 'Lieu', 'Bureau');
    await expect(annonce).toHaveText(ECHEC);
    await expect(annonce).toHaveClass('sous-jour echec');
    expect(await premiere(), `${schema} : rien ne bouge sous le doigt pendant la panne`).toBe(avant);
    expect((await dessous()).textes, schema).toEqual([ECHEC]);
    const vu = await annonce.evaluate((e) => {
      const [r, b, g] = [e, e.closest('.entete-jour'), e.closest('.entete-jour').querySelector('.grand-titre')].map((x) => x.getBoundingClientRect());
      return { couleur: getComputedStyle(e).color, sousLeTitre: r.top >= g.bottom - 0.5, dansLeBandeau: r.bottom <= b.bottom - 17.5 };
    });
    expect(vu, schema).toEqual({ couleur: rgb(t.text), sousLeTitre: true, dansLeBandeau: true });
    // La panne passée (le nouvel essai, 1,5 s plus tard, réussit) : « Enregistré » annoncé, la ligne repart.
    await page.evaluate(() => { window.__panne = false; });
    await expect(annonce).toHaveText('Enregistré');
    await expect(annonce).toHaveClass('visuellement-cache');
    expect(await premiere(), schema).toBe(avant);
    await expect.poll(async () => (await page.evaluate(() => window.__carnet.repo.journal.lire('2026-10-15'))).lieu).toBe('lieu:bureau');
    // Plus bas dans la page (défilée de 600 px, l'en-tête hors de l'écran) : le choix sous le doigt reste à sa place, pendant
    // la panne et après. Le toucher passe par l'élément, sans que Playwright fasse défiler la page.
    await page.evaluate(() => window.scrollTo(0, 600));
    const partiel = () => page.evaluate(() => {
      const b = [...document.querySelectorAll('[aria-label="Traitement pris"] button')].find((x) => x.textContent.includes('Partiel'));
      return { haut: b.getBoundingClientRect().top, defile: scrollY };
    });
    const loin = await partiel();
    await page.evaluate(() => { window.__panne = true; });
    await page.evaluate(() => [...document.querySelectorAll('[aria-label="Traitement pris"] button')].find((x) => x.textContent.includes('Partiel')).click());
    await expect(annonce).toHaveClass('sous-jour echec');
    const pendant = await partiel();
    expect(pendant.haut, `${schema} : défilée, pendant la panne`).toBeCloseTo(loin.haut, 0);
    expect(pendant.defile, schema).toBe(640);
    await page.evaluate(() => { window.__panne = false; });
    await expect(annonce).toHaveClass('visuellement-cache');
    const apres = await partiel();
    expect(apres.haut, `${schema} : défilée, la panne passée`).toBeCloseTo(loin.haut, 0);
    expect(apres.defile, schema).toBe(600);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  // Avant 4 h : « Encore jeudi jusqu'à 4 h. », seule ligne sous le titre ; la région annoncée reste masquée.
  await page.clock.setSystemTime(new Date(2026, 9, 16, 1, 30));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Aujourd\'hui, Jeudi 15 octobre');
  await expect(entete.locator('.sous-jour')).toHaveText('Encore jeudi jusqu\'à 4 h.');
  expect((await dessous()).textes).toEqual(['Encore jeudi jusqu\'à 4 h.']);
  await expect(annonce).toHaveClass('visuellement-cache');
  // Une panne avant 4 h : le message prend la place d'« Encore jeudi » ; rien ne bouge sous le doigt, ni pendant, ni après.
  await expect(page.locator('.liste-evenements > li')).toHaveCount(3);
  const nuit = await premiere();
  await installerPanne();
  await toucher(page, 'Lieu', 'Télétravail');
  await expect(annonce).toHaveClass('sous-jour echec');
  expect((await dessous()).textes).toEqual([ECHEC]);
  expect(await premiere(), 'avant 4 h, pendant la panne').toBe(nuit);
  await page.evaluate(() => { window.__panne = false; });
  await expect(annonce).toHaveClass('visuellement-cache');
  expect((await dessous()).textes).toEqual(['Encore jeudi jusqu\'à 4 h.']);
  expect(await premiere(), 'avant 4 h, la panne passée').toBe(nuit);
});

// Spec §2 point 3 et §3.3 : le mot choisi reste une bulle ronde agrandie, son libellé noir dessus : un disque (largeur =
// hauteur, rayon = la moitié, la bulle seule et son libellé, rien de peint dans les coins de sa boîte), plus gros que toutes
// ses voisines (156 contre 120 au plus), à 3,5 pt au moins d'elles, dans l'écran ; plus de double capsule. Le même en clair
// et en sombre, et avec « Réduire les animations » ; au milieu de la carte (Calme) comme dans son coin (Enragé, rouge).
// Mesuré au repos, la lentille posée sur lui. Après un glissement, la lentille suit le milieu (v10) : le mot du milieu,
// choisi ou non, a 156, et le mot choisi ailleurs la taille qu'elle lui donne (v10-carte.spec.js) ; réserve de la v12.1, à
// trancher par l'utilisateur (relecture de la tâche B).
test('v12.1 (B) · le mot choisi reste un disque agrandi, son libellé noir dessus, plus gros que ses voisines sans les recouvrir, au milieu de la carte comme à son bord ; le même en clair et en sombre, avec et sans « Réduire les animations »', async ({ page }) => {
  test.setTimeout(90000);
  const vus = {};
  for (const [schema] of THEMES) {
    for (const mouvement of ['no-preference', 'reduce']) {
      for (const [zone, libelle] of [['vert', 'Calme'], ['rouge', 'Enragé']]) {
        const quoi = `${schema} · ${mouvement} · ${libelle}`;
        await page.emulateMedia({ colorScheme: schema, reducedMotion: mouvement });
        await aller(page, '#/aujourdhui');
        await aller(page, '#/moment');
        const vue = vueMoment(page);
        await noter(vue, zone, libelle);
        await expect(mot(vue, libelle), quoi).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(() => mot(vue, libelle).evaluate((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; }), quoi)
          .toEqual([195, 422]);
        await stabiliser(page);
        const m = await mot(vue, libelle).evaluate((b) => {
          const r = b.getBoundingClientRect();
          const s = getComputedStyle(b);
          const [cx, cy, rayon] = [r.left + r.width / 2, r.top + r.height / 2, r.width / 2];
          // Un point de sa boîte hors du disque, sur la diagonale (à 11,5 % du coin) : un rectangle arrondi au rayon 39, ou la
          // double capsule, y peignait encore.
          const coin = document.elementFromPoint(r.left + r.width * 0.115, r.top + r.height * 0.115);
          const autres = [...document.querySelectorAll('.bulle-mot')].filter((x) => x !== b).map((x) => x.getBoundingClientRect());
          const e = b.querySelector('.etiquette-mot');
          const plage = document.createRange();
          plage.selectNodeContents(e);
          const lignes = [...plage.getClientRects()];
          return {
            boite: [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], rayon: s.borderTopLeftRadius, fond: s.backgroundColor,
            enfants: [...b.children].map((x) => x.className), coin: Boolean(coin && coin.closest('.bulle-mot') === b),
            plusGrosse: Math.max(...autres.map((q) => Math.round(q.width))),
            ecart: Math.min(...autres.map((q) => Math.hypot(q.left + q.width / 2 - cx, q.top + q.height / 2 - cy) - q.width / 2 - rayon)),
            dansLEcran: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
            libelle: [e.textContent, getComputedStyle(e).color, new Set(lignes.map((q) => Math.round(q.top))).size <= 2,
              lignes.every((q) => [[q.left, q.top], [q.right, q.top], [q.left, q.bottom], [q.right, q.bottom]].every(([x, y]) => Math.hypot(x - cx, y - cy) <= rayon + 0.5))],
          };
        });
        expect([m.boite, m.rayon, m.enfants, m.coin], quoi).toEqual([[156, 156], '50%', ['etiquette-mot'], false]);
        expect(m.plusGrosse, quoi).toBeLessThanOrEqual(120);
        expect(m.ecart, quoi).toBeGreaterThanOrEqual(3.5);
        expect(m.dansLEcran, quoi).toBe(true);
        expect(m.libelle, quoi).toEqual([libelle, 'rgb(0, 0, 0)', true, true]);
        // Le même rendu dans les deux thèmes et les deux réglages : sa couleur (celle de sa case) ne change pas.
        vus[libelle] = vus[libelle] || m.fond;
        expect(m.fond, quoi).toBe(vus[libelle]);
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

// ---------- Tâche 5 : les autres écrans et les graphiques ----------

// Les contrôles de l'accent (tests/aides/controle.js), qui passent sur chaque écran du contrôle global, voient pour de bon ce
// qu'ils cherchent : un point ou un disque d'accent sans texte ni icône, un rond d'un SVG à l'accent, l'accent dans un
// graphique, un lien d'accent sur --surface-2 ; et laissent passer un rond qui porte une icône (une commande) et un contrôle
// autour d'un graphique.
test('v12 (5/9) · les contrôles de l\'accent voient pour de bon un point d\'accent, l\'accent dans un graphique et un lien d\'accent sur --surface-2, et laissent passer une commande ronde à icône', async ({ page }) => {
  const accents = [rgb(clair.accent), rgb(clair['accent-texte'])];
  const verifier = async () => ({
    ronds: await rondsAccent(page, accents), lieux: await accentHorsDeSaPlace(page, accents),
    liens: await liensSurSurface2(page, rgb(clair['accent-texte']), rgb(clair['surface-2'])),
  });
  await verserControle(page);
  await aller(page, '#/analyse');
  await expect(page.locator('main')).not.toContainText('Calcul…', { timeout: 30000 });
  await expect(page.locator('figure.graphe').first()).toBeVisible();
  await stabiliser(page);
  expect(await verifier()).toEqual({ ronds: [], lieux: [], liens: [] });
  await page.evaluate(() => {
    const main = document.querySelector('main');
    const el = (balise, classe, style, parent = main) => {
      const e = document.createElement(balise);
      e.className = classe;
      e.style.cssText = style;
      parent.append(e);
      return e;
    };
    el('i', 'essai-point', 'display: block; width: 10px; height: 10px; background: var(--accent);');
    el('div', 'essai-disque', 'width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--accent-texte);');
    const commande = el('button', 'essai-commande', 'width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--accent);');
    commande.append(document.querySelector('.onglets svg').cloneNode(true));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'essai-svg');
    svg.innerHTML = '<circle class="essai-rond" cx="6" cy="6" r="4" />';
    main.append(svg);
    svg.firstChild.style.fill = 'var(--accent)';
    const figure = document.querySelector('figure.graphe');
    el('span', 'essai-graphe', 'color: var(--accent-texte);', figure).textContent = 'accent';
    el('button', 'essai-controle', 'color: var(--accent-texte);', figure).textContent = 'Voir';
    el('span', 'essai-lien', 'color: var(--accent-texte);', el('div', 'essai-fond', 'background: var(--surface-2);')).textContent = 'Voir ce jour';
  });
  const f = await verifier();
  expect([...new Set(f.ronds.map((x) => x.split(' ')[0]))].sort()).toEqual(['circle.essai-rond', 'div.essai-disque', 'i.essai-point']);
  expect(f.lieux).toEqual(['graphe › span.essai-graphe : color à l\'accent']);
  expect(f.liens).toEqual(['« Voir ce jour » (span.essai-lien) : un lien d\'accent sur --surface-2']);
});

// Spec §5.5 : la couleur ne dit qu'une émotion. Hors des zones et des familles, un graphique est à l'encre (--donnee*), jamais
// à l'accent ; ses séries se distinguent par leur forme et leur rampe : le pas le plus discret d'une rampe (nuit Mal, énergie
// basse) a un contour à 3:1 au moins sur la carte, et « peu de valeurs » est une barre creuse au contour à 3:1 au moins, sur la
// carte comme sur la piste (au lieu d'une barre pâlie à 0,45, 2,25:1).
test('v12 (5/9) · les graphiques sont à l\'encre : les séries de Mes jours se distinguent par leur forme, le pas discret des rampes a un contour à 3:1, « peu de valeurs » est une barre creuse au contour à 3:1, en clair et en sombre', async ({ page }) => {
  await verserControle(page);
  // À l'encre : aucun trait ni fond, ou une couleur de la base (v12.1 : un gris ou une teinte pétrole à peine saturée).
  const neutre = (c) => c === 'none' || /rgba\(0, 0, 0, 0\)/.test(c) || dePetrole(c);
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await page.reload();
    await aller(page, '#/analyse');
    await expect(page.locator('main')).not.toContainText('Calcul…', { timeout: 30000 });
    const mesJours = page.locator('figure.graphe', { hasText: 'Mes jours' });
    await expect(mesJours.locator('svg[role="img"]')).toBeVisible();
    const m = await mesJours.evaluate((f) => {
      const s = (e) => getComputedStyle(e);
      const serie = (sel) => [...f.querySelectorAll(sel)].map((e) => ({ forme: e.tagName, fill: s(e).fill, stroke: s(e).stroke }));
      return {
        carte: s(f).backgroundColor,
        series: {
          notes: serie('svg[role="img"] g.g-notes > circle'), nuits: serie('svg[role="img"] rect[class^="g-sommeil-"]'),
          explosions: serie('g.g-explosions > rect'), energie: serie('g.g-energie-basse > rect'), seances: serie('g.g-seances > polygon'),
        },
        rampe: [1, 2, 3].map((i) => s(f.querySelector(`.pas-rampe rect.g-sommeil-${i}`)).fill),
        discrets: [...f.querySelectorAll('rect.g-sommeil-1')].map((e) => [s(e).stroke, s(e).strokeWidth]),
      };
    });
    // Chaque série a sa forme : un point (rond) par note, une barre par nuit, une encoche par explosion, une barre par jour
    // d'énergie basse, un losange par séance de Bien-être.
    const formes = Object.fromEntries(Object.entries(m.series).map(([k, v]) => [k, [...new Set(v.map((x) => x.forme))]]));
    expect(formes, schema).toEqual({ notes: ['circle'], nuits: ['rect'], explosions: ['rect'], energie: ['rect'], seances: ['polygon'] });
    for (const [k, v] of Object.entries(m.series)) {
      for (const x of v) expect([x.fill, x.stroke].filter((c) => !neutre(c)), `${schema} · ${k} : à l'encre`).toEqual([]);
    }
    // La rampe des nuits : les trois pas de l'encre, distincts ; le pas discret, cerclé du pas suivant, à 3:1 sur la carte.
    expect(m.rampe, schema).toEqual([rgb(t['donnee-1']), rgb(t['donnee-2']), rgb(t['donnee-3'])]);
    expect(m.discrets.length, schema).toBeGreaterThan(1);
    for (const [trait, largeur] of m.discrets) {
      expect([trait, largeur], schema).toEqual([rgb(t['donnee-2']), '1px']);
      expect(contraste(trait, m.carte), `${schema} : contour du pas discret`).toBeGreaterThanOrEqual(3);
    }
    // Ta journée : l'énergie en rampe de l'encre, son pas discret cerclé de même.
    const journee = page.locator('figure.graphe', { hasText: 'Ta journée heure par heure' });
    const energie = await journee.evaluate((f) => [1, 2, 3].map((i) => { const r = f.querySelector(`.pas-rampe rect.g-energie-${i}`); return [getComputedStyle(r).fill, getComputedStyle(r).stroke]; }));
    expect(energie.map((x) => x[0]), schema).toEqual([rgb(t['donnee-1']), rgb(t['donnee-2']), rgb(t['donnee-3'])]);
    expect(energie[0][1], schema).toBe(rgb(t['donnee-2']));
    expect(contraste(energie[0][1], m.carte), schema).toBeGreaterThanOrEqual(3);
    // « Peu de valeurs », dans « Avant mes jours à énergie basse » : une barre creuse, jamais pâlie.
    await aller(page, '#/comprendre/energie');
    const avant = page.locator('figure.graphe', { hasText: 'Avant mes jours à énergie basse' });
    await expect(avant.locator('rect.g-barre-creuse').first()).toBeVisible();
    const creuses = await avant.evaluate((f) => ({
      carte: getComputedStyle(f).backgroundColor, piste: getComputedStyle(f.querySelector('rect.g-piste')).fill, pales: f.querySelectorAll('.g-peu').length,
      legende: Boolean([...f.querySelectorAll('.legende-graphe > span')].find((x) => x.textContent.includes('peu de valeurs') && x.querySelector('rect.g-barre-creuse'))),
      barres: [...f.querySelectorAll('rect.g-barre-creuse')].map((r) => [getComputedStyle(r).fill, getComputedStyle(r).stroke, getComputedStyle(r).opacity]),
    }));
    expect([creuses.pales, creuses.legende], schema).toEqual([0, true]);
    for (const [fond, trait, opacite] of creuses.barres) {
      expect([fond, trait, opacite], schema).toEqual([rgb(t.surface), rgb(t.donnee), '1']);
      expect(contraste(trait, creuses.carte), `${schema} : peu de valeurs, sur la carte`).toBeGreaterThanOrEqual(3);
      expect(contraste(trait, creuses.piste), `${schema} : peu de valeurs, sur la piste`).toBeGreaterThanOrEqual(3);
    }
  }
});

// Les aplats d'accent d'une vue : les éléments visibles peints à l'accent (hors des choix faits), dans l'écran ou le parcours.
const aplats = (page, accent) => page.evaluate((acc) => [...document.querySelectorAll('main *, .parcours *')]
  .filter((e) => e.getClientRects().length && getComputedStyle(e).backgroundColor === acc && !e.closest('[aria-pressed="true"]'))
  .map((e) => e.getAttribute('aria-label') || e.textContent.trim()), accent);
// Les rangées d'une liste : l'icône (place, fond, couleur) et le chevron.
const rangees = (loc) => loc.evaluate((ul) => [...ul.querySelectorAll('.ligne-carte')].map((a) => {
  const i = a.querySelector('.icone-ligne');
  return { texte: a.textContent.trim(), fond: getComputedStyle(i).backgroundColor, icone: getComputedStyle(i.querySelector('svg')).color,
    chevron: getComputedStyle(a.querySelector(':scope > svg:last-child')).color };
}));

// Spec §5.4 : une seule action en aplat par vue, « Reprendre » dans Bien-être et « Commencer » dans Moment difficile ; les petits
// ▶ des favoris et des listes deviennent une icône d'accent sans fond. Les rangées qui ouvrent quelque chose ont leur icône à
// l'accent, sans carré, et leur chevron en --contour. « Faite le… » du Programme est à l'encre (§5.3 : jamais un « fait » à l'accent).
test('v12 (5/9) · une seule action en aplat par vue : « Reprendre » dans Bien-être, « Commencer » dans Moment difficile ; les ▶ des favoris et des listes, une icône d\'accent sans fond ; les entrées à l\'icône d\'accent ; « Faite le… » à l\'encre, en clair et en sombre', async ({ page }) => {
  await verserControle(page);
  await page.evaluate(async () => {
    localStorage.setItem('carnet:bien-etre:dernier', JSON.stringify('expiration-longue'));
    await window.__carnet.repo.meta.ecrire('favorisBienEtre', ['soupir', 'sons-de-fond']);
  });
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    await aller(page, '#/aujourdhui');
    await aller(page, '#/bien-etre');
    const entrees = page.getByRole('list', { name: 'Entrées' });
    await expect(entrees.getByRole('link')).toHaveCount(5);
    await expect(page.locator('.bien-etre .ligne-element')).toHaveCount(2);
    expect(await aplats(page, rgb(t.accent)), schema).toEqual(['Commencer Expiration longue']);
    const petits = await page.locator('.bien-etre .bouton-lecture.petit').evaluateAll((l) => l.map((b) => [getComputedStyle(b).backgroundColor, getComputedStyle(b).color,
      Math.round(b.getBoundingClientRect().width)]));
    expect(petits, schema).toEqual([[TRANSPARENT, rgb(t['accent-texte']), 48], [TRANSPARENT, rgb(t['accent-texte']), 48]]);
    for (const r of await rangees(entrees)) {
      expect([r.fond, r.icone, r.chevron], `${schema} · ${r.texte}`).toEqual([TRANSPARENT, rgb(t['accent-texte']), rgb(t.contour)]);
    }
    // Une liste d'entrée : aucun aplat, ses ▶ en icônes d'accent.
    await aller(page, '#/bien-etre/calmer');
    await expect(page.locator('.entree-bien-etre .ligne-element').first()).toBeVisible();
    expect(await aplats(page, rgb(t.accent)), schema).toEqual([]);
    // Le Programme : « Faite le… » et sa coche à l'encre.
    await aller(page, '#/bien-etre/programme');
    const faite = page.locator('.programme .seance-faite').first();
    await expect(faite).toContainText('Faite le');
    expect(await faite.evaluate((e) => [getComputedStyle(e).color, getComputedStyle(e.querySelector('svg')).color]), schema).toEqual([rgb(t['text-2']), rgb(t.text)]);
    // Moment difficile : « Commencer » seul en aplat ; les exercices courts neutres ; Mon plan, son icône en --text-2.
    await aller(page, '#/aujourdhui');
    await aller(page, '#/moment-difficile');
    const vue = page.getByRole('dialog', { name: 'Moment difficile' });
    await expect(vue.getByRole('button', { name: 'Commencer', exact: true })).toBeVisible();
    expect(await aplats(page, rgb(t.accent)), schema).toEqual(['Commencer']);
    await vue.getByRole('button', { name: 'Fermer', exact: true }).click();
  }
});

// Spec §5.3 : le curseur de volume, comme sur iOS, sa partie remplie à l'accent jusqu'au bouton, blanc. WebKit ne donne pas le
// style calculé des pseudo-éléments du curseur : on lit la part remplie (--part, posée par sons.js) et la feuille de style.
test('v12 (5/9) · le volume des sons de fond, comme sur iOS : la part remplie de la piste suit la valeur, à l\'accent ; le bouton est blanc', async ({ page }) => {
  await aller(page, '#/sons');
  const volume = page.getByRole('slider', { name: 'Volume' });
  await expect(volume).toHaveValue('0.5');
  const part = () => volume.evaluate((i) => i.style.getPropertyValue('--part'));
  expect(await part()).toBe('0.474');
  await volume.fill('1');
  await expect.poll(part).toBe('1');
  await volume.fill('0.05');
  await expect.poll(part).toBe('0');
  const regles = await page.evaluate(() => {
    const toutes = [...document.styleSheets].flatMap((f) => [...f.cssRules]);
    const de = (pseudo) => toutes.find((r) => r.selectorText && r.selectorText.includes('.reglage-volume') && r.selectorText.includes(pseudo));
    return { piste: de('slider-runnable-track').style.getPropertyValue('background-image') || de('slider-runnable-track').style.background,
      bouton: de('slider-thumb').style.backgroundColor };
  });
  expect(regles.piste).toContain('var(--accent) var(--rempli)');
  expect(regles.piste).toContain('var(--contour) var(--rempli)');
  expect(regles.bouton).toBe('rgb(255, 255, 255)');
});

// Spec §5.2 : les étiquettes du noting, au fond d'un choix non fait (transparentes en v12, --surface en v12.1), ont le contour d'un bouton non rempli (--contour, 3:1 au moins sur le
// fond), comme « Précédent » et « Suivant » à côté. Relecture de la tâche 5 : en --line, un filet, elles se voyaient à peine
// (1,53:1 en clair, 1,79:1 en sombre). Une bordure, pas un box-shadow : le halo du toucher anime déjà box-shadow.
test('v12 (5/9) · les étiquettes du noting ont le contour d\'un bouton non rempli, en --contour, à 3:1 au moins sur le fond du parcours, en clair et en sombre', async ({ page }) => {
  await installerParole(page);
  await page.reload();
  await aller(page, '#/exercice/noting');
  const vue = page.getByRole('dialog', { name: 'Noter ce qui passe' });
  await vue.getByRole('button', { name: 'Commencer', exact: true }).click();
  const etiquettes = vue.locator('.etiquettes-noting .etiquette-noting');
  // Jusqu'aux étiquettes : les étapes avancent aussi seules, le lecteur y est peut-être déjà.
  for (let i = 0; i < 4 && await etiquettes.count() === 0; i += 1) await vue.getByRole('button', { name: 'Suivant', exact: true }).click();
  await expect(etiquettes).toHaveCount(4);
  for (const [schema, t] of THEMES) {
    await page.emulateMedia({ colorScheme: schema });
    const m = await vue.evaluate((v) => ({
      fond: getComputedStyle(v).backgroundColor,
      voisins: [...v.querySelectorAll('.actions-lecteur .btn')].map((b) => getComputedStyle(b).boxShadow),
      etiquettes: [...v.querySelectorAll('.etiquette-noting')].map((b) => {
        const s = getComputedStyle(b);
        return { nom: b.textContent.trim(), bord: [s.borderTopColor, s.borderTopWidth, s.borderTopStyle], fond: s.backgroundColor };
      }),
    }));
    expect(m.fond, schema).toBe(rgb(t.bg));
    expect(m.etiquettes.map((e) => e.nom), schema).toEqual(['Pensée', 'Corps', 'Son', 'Émotion']);
    for (const e of m.etiquettes) {
      expect([...e.bord, e.fond], `${schema} · ${e.nom}`).toEqual([rgb(t.contour), '1px', 'solid', rgb(t.surface)]);
      expect(contraste(e.bord[0], m.fond), `${schema} · ${e.nom} : son contour sur le fond`).toBeGreaterThanOrEqual(3);
    }
    // « Précédent » et « Suivant », à côté : le même contour.
    expect(m.voisins.length, schema).toBeGreaterThan(0);
    for (const c of m.voisins) expect(c, schema).toBe(contourDe(t));
  }
});

// v12.1.1 (demande de l'utilisateur, 16/11) : dans les grilles de parcours, le libellé est centré dans sa bulle : « Ce qui a
// pesé » et « Ce qui a rechargé » (Aujourd'hui), le déclencheur et ce qui est dessous (épisode). Non choisi, le libellé seul ;
// choisi, la coche et le libellé ensemble. Un libellé sur deux lignes est centré aussi. Le choix ne décale rien en hauteur
// ni en largeur de la bulle. Clair et sombre.
const ecartsDuCentre = (loc) => loc.evaluate(async (g) => {
  await Promise.all(g.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})));
  return [...g.querySelectorAll('button.pastille:not(.pastille-ajout)')].filter((b) => b.lastElementChild).map((b) => {
    const p = b.getBoundingClientRect();
    const l = b.lastElementChild.getBoundingClientRect();
    const c = b.querySelector(':scope > .coche');
    const gauche = c && getComputedStyle(c).display !== 'none' ? c.getBoundingClientRect().left : l.left;
    return { nom: b.textContent.trim().slice(0, 24), ecart: Math.abs((gauche + l.right) / 2 - (p.left + p.right) / 2), aligne: getComputedStyle(b).textAlign, taille: [p.width, p.height] };
  });
});

test('v12.1.1 : le libellé est centré dans les bulles de « Ce qui a pesé / rechargé » et de l\'épisode, choisies ou non', async ({ page }) => {
  for (const schema of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: schema });
    await aller(page, '#/aujourdhui');
    const repli = page.getByRole('button', { name: /^Ce qui a pesé/ });
    if ((await repli.getAttribute('aria-expanded')) !== 'true') await repli.click();
    for (const nom of ['Ce qui a pesé', 'Ce qui a rechargé']) {
      const g = page.getByRole('group', { name: nom, exact: true });
      await expect(g).toBeVisible();
      const avant = await ecartsDuCentre(g);
      expect(avant.length, `${schema} · ${nom}`).toBeGreaterThan(4);
      for (const e of avant) { expect(e.ecart, `${schema} · ${nom} · ${e.nom}`).toBeLessThanOrEqual(1); expect(e.aligne).toBe('center'); }
      await g.getByRole('button').first().click();
      const apres = await ecartsDuCentre(g);
      for (const [i, e] of apres.entries()) {
        expect(e.ecart, `${schema} · ${nom} · ${e.nom} (après un choix)`).toBeLessThanOrEqual(1);
        expect(e.taille, `${schema} · ${nom} · ${e.nom} : rien ne change de taille`).toEqual(avant[i].taille);
      }
      await g.getByRole('button').first().click();
    }
    await aller(page, '#/episode/nouveau');
    const fiche = page.getByRole('dialog', { name: 'Épisode' });
    const grille = fiche.locator('.pastilles.grille-choix').first();
    await expect(grille).toBeVisible();
    const avant = await ecartsDuCentre(grille);
    expect(avant.length, `${schema} · épisode`).toBeGreaterThan(4);
    for (const e of avant) { expect(e.ecart, `${schema} · épisode · ${e.nom}`).toBeLessThanOrEqual(1); expect(e.aligne).toBe('center'); }
    await grille.getByRole('button').nth(1).click();
    const apres = await ecartsDuCentre(grille);
    for (const [i, e] of apres.entries()) expect(e.ecart, `${schema} · épisode · ${e.nom} (après un choix)`).toBeLessThanOrEqual(1);
    expect(apres[1].taille).toEqual(avant[1].taille);
  }
});

// v12.1.2 (demande de l'utilisateur, 16/11) : « Ce qui a pesé » et « Ce qui a rechargé » n'étaient pas en gras (.etiquette, en
// 400), les titres des replis en 500. Tout ce qui nomme (un groupe de choix, un champ, un repli) a la graisse des titres de
// rubrique d'Aujourd'hui, lue sur « Lieu » (700). Ce qui ne nomme pas reste en 400 : « la veille », le résumé d'un repli et
// les choix non faits. La graisse ne dépend pas du thème : une passe suffit.
test('v12.1.2 : sur Aujourd\'hui, « Ce qui a pesé », « Ce qui a rechargé », les étiquettes de la nuit et les titres des replis ont la graisse des titres de rubrique', async ({ page }) => {
  await page.evaluate(() => window.__carnet.repo.journal.patch('2026-10-15', { heureCoucher: '23:20', heureLever: '07:10' }));
  await page.reload();
  await aller(page, '#/aujourdhui');
  const graisse = (loc) => loc.evaluate((e) => getComputedStyle(e).fontWeight);
  const lieu = page.locator('.titre-rubrique', { hasText: /^Lieu$/ });
  await expect(lieu).toBeVisible();
  const reference = await graisse(lieu);
  expect(reference).toBe('700');
  for (const [repli, etiquettes] of [[/^Ce qui a pesé/, ['Ce qui a pesé', 'Ce qui a rechargé']], [/^Nuit en détail/, ['Coucher', 'Lever', 'Réveils']]]) {
    const bouton = page.getByRole('button', { name: repli });
    if ((await bouton.getAttribute('aria-expanded')) !== 'true') await bouton.click();
    const corps = page.locator('.repli', { has: bouton }).locator('.repli-corps');
    for (const nom of etiquettes) {
      const e = corps.locator('.etiquette', { hasText: new RegExp(`^${nom}`) });
      await expect(e, nom).toBeVisible();
      expect(await graisse(e), nom).toBe(reference);
    }
  }
  expect(await graisse(page.locator('.etiquette .facultatif', { hasText: 'la veille' })), '« la veille »').toBe('400');
  for (const nom of ['Ce qui a pesé', 'Ce qui a rechargé']) {
    const g = page.getByRole('group', { name: nom, exact: true });
    expect(await g.locator('button.pastille[aria-pressed="false"]').first().evaluate((b) => getComputedStyle(b).fontWeight), `${nom} : un choix non fait`).toBe('400');
  }
  const replis = await page.locator('.replis > .repli').evaluateAll((l) => l.map((r) => {
    const resume = r.querySelector('.repli-resume');
    return { titre: r.querySelector('.repli-titre').textContent, graisse: getComputedStyle(r.querySelector('.repli-titre')).fontWeight, resume: resume && getComputedStyle(resume).fontWeight };
  }));
  expect(replis.map((r) => r.titre)).toEqual(['Nuit en détail', 'Ce qui a pesé · ce qui a rechargé', 'Notes libres']);
  for (const r of replis) {
    expect(r.graisse, r.titre).toBe(reference);
    if (r.resume) expect(r.resume, `${r.titre} : son résumé`).toBe('400');
  }
});

// v12.1.2 : les règles partagées des titres, vues à l'écran. Un titre d'onglet, un libellé de section, le nom d'un parcours,
// la question d'une étape et le titre en grand du lecteur ont la graisse de « Lieu » (700) ; Moment difficile, Une chose à la
// fois et « Réveil la nuit » gardent leur typographie (600), jusque dans les règles qu'ils partagent avec les autres écrans.
test('v12.1.2 : les titres partagés à la graisse des titres de rubrique (Réglages, Épisode, le lecteur de Bien-être) ; Moment difficile, Une chose à la fois et « Réveil la nuit » gardent leur 600', async ({ page }) => {
  await installerParole(page);
  await verserControle(page);
  await page.reload();
  await aller(page, '#/aujourdhui');
  const graisses = (loc) => loc.evaluateAll((l) => l.map((e) => getComputedStyle(e).fontWeight));
  await expect(page.locator('.titre-rubrique').first()).toBeVisible();
  const reference = (await graisses(page.locator('.titre-rubrique')))[0];
  expect(reference).toBe('700');
  await aller(page, '#/reglages');
  await expect(page.locator('.titre-onglet')).toHaveText('Réglages');
  expect(await graisses(page.locator('.titre-onglet, .libelle-section'))).toEqual(Array(1 + await page.locator('.libelle-section').count()).fill(reference));
  await aller(page, '#/aujourdhui');
  await aller(page, '#/episode/nouveau');
  const episode = page.getByRole('dialog', { name: 'Épisode' });
  await expect(episode.locator('.titre-question')).toBeVisible();
  expect(await graisses(episode.locator('.parcours-tete .nom, .titre-question')), 'Épisode').toEqual([reference, reference]);
  await episode.getByRole('button', { name: 'Fermer', exact: true }).click();
  await aller(page, '#/aujourdhui');
  await aller(page, '#/exercice/expiration-longue');
  await expect(page.locator('.titre-parcours')).toBeVisible();
  expect(await graisses(page.locator('.titre-parcours')), 'le lecteur, avant').toEqual([reference]);
  await aller(page, '#/aujourdhui');
  await aller(page, '#/moment-difficile');
  const md = page.getByRole('dialog', { name: 'Moment difficile' });
  await expect(md.locator('.plan-moment .libelle-section').first()).toBeVisible();
  expect(new Set(await graisses(md.locator('.parcours-tete .nom, .libelle-section'))), 'Moment difficile').toEqual(new Set(['600']));
  await md.getByRole('button', { name: 'Une chose à la fois' }).click();
  const uneChose = page.getByRole('dialog', { name: 'Une chose à la fois' });
  await expect(uneChose.locator('.parcours-tete .nom')).toBeVisible();
  expect(await graisses(uneChose.locator('.parcours-tete .nom')), 'Une chose à la fois').toEqual(['600']);
  await uneChose.getByRole('button', { name: 'Fermer', exact: true }).click();
  await aller(page, '#/aujourdhui');
  await aller(page, '#/exercice/reveil-nuit');
  const nuit = page.locator('.parcours.ecran-noir');
  await expect(nuit.getByRole('button', { name: 'Commencer' })).toBeVisible();
  expect(await graisses(nuit.locator('.titre-parcours')), '« Réveil la nuit », avant').toEqual(['600']);
  await nuit.getByRole('button', { name: 'Commencer' }).click();
  await expect(nuit.locator('.parcours-tete .nom')).toBeVisible();
  expect(await graisses(nuit.locator('.parcours-tete .nom')), '« Réveil la nuit », en cours').toEqual(['600']);
});
