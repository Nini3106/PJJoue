/**
 * Atlas V1 — palette de présentation partagée.
 * Les valeurs d'origine restent dans les données ; seuls les accents affichés
 * sont intensifiés. Aucun score, identifiant, ordre ou état n'est transformé.
 */
const ACCENTS_ATLAS = Object.freeze({
    "#c4a333": "#b8870a",
    "#55a4bb": "#167f9c",
    "#a289c4": "#8753b7",
    "#d57d96": "#c3426a",
    "#55a396": "#1b8271",
    "#789bd4": "#3f72bb",
    "#39d7c4": "#138c7f",
    "#ffc83d": "#b3860b",
    "#a986ff": "#8251cb",
    "#62c5ff": "#147fba",
    "#ff9e5e": "#c76727",
    "#5fe0a0": "#27885a",
    "#ffcf66": "#ad7e19",
    "#f49ac2": "#bb4c81",
    "#52d6c8": "#168779",
    "#78aef5": "#4175bd",
    "#c59cff": "#8e58c2",
    "#eb78ac": "#bc437b",
    "#74d4ff": "#157c9f",
    "#a7df75": "#648527",
    "#ff8b73": "#c1543b",
    "#d49a00": "#b8870a",
    "#0891b2": "#167f9c",
    "#8b5cf6": "#8753b7",
    "#e11d48": "#c3426a",
    "#0f766e": "#1b8271",
    "#4f8cff": "#3f72bb"
});
function obtenirAccentAtlas(couleur) {
    return ACCENTS_ATLAS[String(couleur).toLowerCase()] || couleur;
}
function obtenirCouleursAtlas(couleurSource) {
    const couleur = obtenirAccentAtlas(couleurSource);
    const composantes = /^#[0-9a-f]{6}$/i.test(couleur || '')
        ? couleur.slice(1).match(/.{2}/g).map(valeur => parseInt(valeur, 16))
        : [33, 79, 186];
    const encre = [23, 45, 72];
    const couleurTexte = '#' + composantes.map((valeur, index) =>
        Math.round(valeur * .72 + encre[index] * .28).toString(16).padStart(2, '0')
    ).join('');
    return { couleur, couleurTexte, couleurRgb: composantes.join(',') };
}
