import { Speak } from "../get-speaks/speak.js";
import { Speaker } from "../get-all-speakers/speaker.js";

const DEFAULT_PROXIMITY_CHARS = 60;

function nameIndex(pageText: string, speaker: Speaker): number {
  return pageText.toLowerCase().indexOf(speaker.lastname.toLowerCase());
}

// Filet de sécurité déterministe pour un cas que le prompt seul ne résout pas de
// façon fiable (observé en pratique, même avec des instructions explicites) :
// deux co-intervenants listés côte à côte avant un seul intitulé — le modèle
// attribue parfois le titre à un seul des deux. Si un speaker connu reste sans
// titre mais qu'un autre speaker connu de la même conférence, avec titre, a son
// nom tout proche dans le texte de la page, on lui attribue le même titre.
// Opère sur des entrées à un seul speaker chacune (avant regroupement par
// groupCoPresentedTalks) : c'est justement la comparaison entre deux entrées
// voisines qui permet de détecter ce cas.
export function fillMissingCoPresenterTitles(
  speaks: Speak[],
  pageText: string,
  proximityChars: number = DEFAULT_PROXIMITY_CHARS,
): Speak[] {
  return speaks.map((speak) => {
    if (speak.title != null) return speak;

    const myIndex = nameIndex(pageText, speak.speakers[0]);
    if (myIndex === -1) return speak;

    const nearbyTitled = speaks.find((other) => {
      if (other === speak || other.title == null) return false;
      const otherIndex = nameIndex(pageText, other.speakers[0]);
      return otherIndex !== -1 && Math.abs(otherIndex - myIndex) <= proximityChars;
    });

    return nearbyTitled ? { ...speak, title: nearbyTitled.title } : speak;
  });
}
