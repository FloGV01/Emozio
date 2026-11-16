import { html } from '../lib.js';

// Les points de zone d'un jour (v9, spec §13.4 ; les points de famille jusqu'à la v8) : un rond par zone présente, à sa
// couleur (.zone-*), dans l'ordre rouge, jaune, bleu, vert (domain/releves.js, zonesDuJour). Dans l'Historique et l'Après
// coup, ils sont masqués à VoiceOver : les mots voisins le disent déjà. (Jusqu'à la v12, sous le titre d'Aujourd'hui, ils
// étaient lus ; v12.1 : ils n'y sont plus.)
export function PointsZones({ zones }) {
  if (!zones || zones.length === 0) return null;
  return html`<span class="zones-jour" aria-hidden="true">${zones.map((z) => html`<i key=${z.cle} class=${`zone-${z.cle}`}></i>`)}</span>`;
}
