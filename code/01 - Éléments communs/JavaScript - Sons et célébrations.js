/**
 * Jouer les sons et afficher les confettis.
 *
 * Lis ce fichier comme une histoire : une fonction explique une petite action.
 * Les mots imposés par le navigateur (document, window, localStorage, history...)
 * gardent leur nom technique, car le navigateur ne comprendrait pas leur traduction.
 */
function initialiserAudio() {
    if (!contexteAudio)
        contexteAudio = new (window.AudioContext || window.webkitAudioContext)();
    if (contexteAudio.state === 'suspended')
        contexteAudio.resume();
}
function jouerTonalite(frequence, demarrage, duree, formeOnde = 'sine', intensite = 1) {
    if (!sauvegarde.parametres.son)
        return;
    initialiserAudio();
    const oscillateur = contexteAudio.createOscillator();
    const amplificateur = contexteAudio.createGain();
    oscillateur.type = formeOnde;
    oscillateur.frequency.setValueAtTime(frequence, contexteAudio.currentTime + demarrage);
    const volume = Number(sauvegarde.parametres.volume || .65) * .18 * intensite;
    amplificateur.gain.setValueAtTime(.001, contexteAudio.currentTime + demarrage);
    amplificateur.gain.exponentialRampToValueAtTime(Math.max(.002, volume), contexteAudio.currentTime + demarrage + .025);
    amplificateur.gain.exponentialRampToValueAtTime(.001, contexteAudio.currentTime + demarrage + duree);
    oscillateur.connect(amplificateur).connect(contexteAudio.destination);
    oscillateur.start(contexteAudio.currentTime + demarrage);
    oscillateur.stop(contexteAudio.currentTime + demarrage + duree + .05);
}
function jouerSonReussite() {
    jouerTonalite(523, 0, .18, 'triangle', .9);
    jouerTonalite(659, .11, .22, 'triangle', 1);
    jouerTonalite(784, .25, .26, 'triangle', 1);
    jouerTonalite(1047, .4, .38, 'sine', .85);
}
function jouerSonErreur() {
    jouerTonalite(196, 0, .25, 'sawtooth', .65);
    jouerTonalite(155, .18, .3, 'sawtooth', .65);
    jouerTonalite(110, .41, .45, 'square', .45);
}
function jouerSonEtapeSansJoker() {
    if (!sauvegarde.parametres.son)
        return;
    const melodie = [523, 659, 784, 1047, 988, 1047, 1175, 1319];
    const demarrages = [0, .18, .36, .58, .82, 1.02, 1.22, 1.48];
    const durees = [.24, .24, .28, .34, .22, .25, .28, .58];
    melodie.forEach((frequence, indice) => jouerTonalite(frequence, demarrages[indice], durees[indice], indice < 4 ? 'triangle' : 'sine', indice === 7 ? .72 : .54));
    [[261.6, 329.6, 392], [349.2, 440, 523.3], [392, 493.9, 587.3], [523.3, 659.3, 784]].forEach((accord, indiceAccord) => {
        const demarrage = [0, .58, 1.02, 1.48][indiceAccord];
        accord.forEach((frequence, indiceNote) => jouerTonalite(frequence, demarrage, indiceAccord === 3 ? .72 : .38, indiceNote === 0 ? 'triangle' : 'sine', indiceNote === 0 ? .28 : .18));
    });
    [1319, 1568, 2093].forEach((frequence, indice) => jouerTonalite(frequence, 1.78 + indice * .12, .28, 'sine', .28));
}
function jouerSonEvaluationFinale() {
    if (!sauvegarde.parametres.son)
        return;
    const fanfare = [523, 523, 659, 784, 659, 784, 1047, 988, 1047, 1319, 1568, 2093];
    const demarrages = [0, .16, .32, .49, .72, .88, 1.05, 1.34, 1.50, 1.72, 2.02, 2.34];
    const durees = [.20, .20, .22, .36, .20, .22, .38, .20, .24, .42, .48, .82];
    fanfare.forEach((frequence, indice) => jouerTonalite(frequence, demarrages[indice], durees[indice], indice < 9 ? 'triangle' : 'sine', indice >= 9 ? .58 : .46));
    const accords = [
        { demarrage: 0, frequences: [261.6, 329.6, 392] },
        { demarrage: .49, frequences: [349.2, 440, 523.3] },
        { demarrage: 1.05, frequences: [392, 493.9, 587.3] },
        { demarrage: 1.50, frequences: [523.3, 659.3, 784] },
        { demarrage: 2.02, frequences: [392, 523.3, 659.3, 784] },
        { demarrage: 2.34, frequences: [523.3, 659.3, 784, 1047] }
    ];
    accords.forEach(({ demarrage, frequences }, indiceAccord) => {
        frequences.forEach((frequence, indiceNote) => {
            jouerTonalite(
                frequence,
                demarrage,
                indiceAccord >= 4 ? .86 : .42,
                indiceNote === 0 ? 'triangle' : 'sine',
                indiceNote === 0 ? .25 : .15
            );
        });
    });
    [130.8, 196, 261.6, 196, 261.6, 392].forEach((frequence, indice) => jouerTonalite(frequence, [0, .49, 1.05, 1.50, 2.02, 2.34][indice], .32, 'square', .11));
    [2093, 2349, 2637, 3136].forEach((frequence, indice) => jouerTonalite(frequence, 2.62 + indice * .14, .36, 'sine', .24));
}
function lancerConfettis(intensite = 1, cible = document.body) {
    const intensiteEffective = Math.max(1, Math.min(4, Number(intensite) || 1));
    const nombreConfettis = Math.round(70 * intensiteEffective);
    const conteneur = cible || document.body;
    const couleurs = ['#ffd166', '#3ddc97', '#ffffff', '#ff5b78', '#9b6cff', '#35d6ff'];
    for (let indiceConfetti = 0; indiceConfetti < nombreConfettis; indiceConfetti++) {
        const confetti = document.createElement('i');
        confetti.setAttribute('aria-hidden', 'true');
        Object.assign(confetti.style, {
            position: 'fixed',
            left: (Math.random() * 100) + 'vw',
            top: '-28px',
            width: (7 + Math.random() * 7) + 'px',
            height: (10 + Math.random() * 12) + 'px',
            borderRadius: Math.random() > .55 ? '50%' : '2px',
            background: couleurs[indiceConfetti % couleurs.length],
            pointerEvents: 'none',
            zIndex: '2147483647',
            opacity: '1',
            transform: `translate3d(0,0,0) rotate(${Math.random() * 180}deg)`
        });
        conteneur.appendChild(confetti);
        const deplacementHorizontal = Math.random() * (280 + intensiteEffective * 70) - (140 + intensiteEffective * 35);
        const deplacementVertical = window.innerHeight + 80 + Math.random() * 180;
        const nombreTours = (2 + Math.random() * 5) * (Math.random() > .5 ? 1 : -1);
        const duree = 1500 + Math.random() * 900 + intensiteEffective * 120;
        const delai = Math.random() * 300;
        const animation = confetti.animate([
            { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate3d(${deplacementHorizontal * .35}px,${deplacementVertical * .45}px,0) rotate(${nombreTours * 180}deg)`, opacity: 1, offset: .48 },
            { transform: `translate3d(${deplacementHorizontal}px,${deplacementVertical}px,0) rotate(${nombreTours * 360}deg)`, opacity: .92 }
        ], { duration: duree, delay: delai, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'forwards' });
        animation.onfinish = () => confetti.remove();
    }
}
