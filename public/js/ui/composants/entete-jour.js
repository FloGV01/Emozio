import { html } from '../lib.js';
import { Icones } from '../icones.js';
import { formaterJourComplet } from '../../domain/dates.js';

const majusculeInitiale = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// En-tête façon App Store (v12, spec §5.4) : un sur-titre en petites capitales grises, « JEUDI 15 OCTOBRE ⌄ », au-dessus
// d'un grand titre, « Aujourd'hui » ; un autre jour, le grand titre dit le jour et le quantième (« Mercredi 14 ») et le
// sur-titre le mois (« OCTOBRE »). Le titre ouvre le sélecteur de date d'iOS (bornes vérifiées en JS) ; ‹ › sont à droite
// du grand titre, dans des ronds neutres (› grisé sur aujourd'hui), et toujours ensemble : un seul bloc, qui passe à la
// ligne entier en très grand texte, jamais › seul (relecture de la tâche 4). Le nom accessible ne change pas
// (« Aujourd'hui, Jeudi 15 octobre », « Mercredi 14 octobre ») : l'aria-label du h1 le donne en toutes lettres, car le nom
// tiré du texte peut prendre les capitales du sur-titre (Chromium lit « Aujourd'hui, JEUDI 15 OCTOBRE », et VoiceOver
// peut épeler des capitales). Le texte suit le même ordre : le DOM met le grand titre avant le sur-titre (ecrans.css les
// inverse à l'écran), et la virgule d'aujourd'hui, lue mais sans taille, reste collée au grand titre. Au-dessus, pour un
// jour ouvert depuis l'Historique (v6.1) : « ‹ Retour ».
// v12.1 (spec §2, point 2) : plus de ligne sous le titre, ni points des zones, ni résumé de la journée, ni « Enregistré » à
// l'écran. Dessous, une ligne seulement quand elle a quelque chose à dire : « Encore jeudi jusqu'à 4 h. » avant 4 h
// (`veille`), ou le message d'échec d'écriture, qui prend sa place (on ne perd jamais une saisie sans le savoir). Elle n'a
// plus de place gardée : quand le message paraît, les champs descendent de sa hauteur, le temps de la panne (une ligne
// vide sous le titre aurait laissé un blanc dans le bandeau, en permanence, pour une panne rare). La région
// role="status" est toujours là, pour que VoiceOver annonce ce qui y change : masquée à l'écran, elle porte « Enregistré »
// après une écriture réussie ; après un échec, elle devient elle-même la ligne visible du message.
export function EnteteJour({ date, aujourdhui, surAller, indicateur, surRetour, veille = null }) {
  const estAujourdhui = date === aujourdhui;
  const surDate = (e) => {
    const v = e.target.value;
    if (v && v <= aujourdhui) surAller(v);
    else e.target.value = date;
  };
  const echec = indicateur === 'echec';
  const jour = majusculeInitiale(formaterJourComplet(date));
  const mots = jour.split(' ');
  // Aujourd'hui : le grand titre, et la date entière en sur-titre ; un autre jour : « Mercredi 14 », puis le mois.
  const sur = estAujourdhui ? mots : mots.slice(-1);
  const grand = estAujourdhui ? "Aujourd'hui" : mots.slice(0, -1).join(' ');
  // Le chevron suit le dernier mot du sur-titre, sans s'en séparer quand il passe à la ligne (grand texte).
  const dernier = sur[sur.length - 1];
  return html`<header class="entete-jour">
    ${surRetour && html`<div class="barre-retour">
      <button type="button" class="retour" onClick=${surRetour}>${Icones.retour({ trait: 2 })}Retour</button>
    </div>`}
    <div class="ligne-jour">
      <div class="titre-jour">
        <h1 aria-label=${estAujourdhui ? `Aujourd'hui, ${jour}` : jour}><span class="grand-titre">${grand}${estAujourdhui && html`<span class="virgule-lue">, </span>`}</span><span class="sur-titre">${sur.slice(0, -1).map((m) => `${m} `)}<span class="fin-titre">${dernier}${Icones.chevronBas({ trait: 2.6 })}</span></span></h1>
        <input type="date" class="choix-date" aria-label="Choisir une date" value=${date} max=${aujourdhui} onChange=${surDate} />
      </div>
      <div class="navs-jour">
        <button type="button" class="nav-jour" aria-label="Jour précédent" onClick=${() => surAller('precedent')}>${Icones.retour({ trait: 2.2 })}</button>
        <button type="button" class="nav-jour" aria-label="Jour suivant" disabled=${estAujourdhui} onClick=${() => surAller('suivant')}>${Icones.chevron({ trait: 2.2 })}</button>
      </div>
    </div>
    ${!echec && veille && html`<p class="sous-jour">${veille}</p>`}
    <p class=${echec ? 'sous-jour echec' : 'visuellement-cache'} role="status" aria-live="polite">${indicateur === 'ok' ? 'Enregistré' : echec ? "Enregistrement impossible pour l'instant, nouvel essai en cours." : ''}</p>
  </header>`;
}
