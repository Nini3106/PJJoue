'use strict';

/**
 * Lecteurs vidéo des guides PJJoue.
 *
 * Les lecteurs YouTube ne sont créés qu'après une action explicite de
 * l'utilisateur. Avant ce clic, aucune iframe YouTube n'est présente dans la
 * page. Les vidéos utilisent le domaine youtube-nocookie.com.
 *
 * L'événement Analytics pjjoue_video_lancee n'est envoyé que si le visiteur a
 * accepté la mesure d'audience. Aucun identifiant YouTube personnel n'est lu
 * par PJJoue.
 */
(() => {
    const SELECTEUR = '[data-pjj-video-id]';

    function envoyerAnalytics(carte, evenement) {
        window.PJJ_ANALYTICS?.envoyer?.(evenement, {
            pjjoue_video_identifiant: carte.dataset.pjjVideoId,
            pjjoue_video_titre: carte.dataset.pjjVideoTitre,
            pjjoue_video_page: carte.dataset.pjjVideoPage,
            pjjoue_video_source: carte.dataset.pjjVideoSource
        });
    }

    function creerLecteur(carte) {
        if (carte.dataset.pjjVideoChargee === 'oui')
            return;

        const identifiant = String(carte.dataset.pjjVideoId || '').trim();
        if (!/^[A-Za-z0-9_-]{11}$/.test(identifiant))
            return;

        const zone = carte.querySelector('[data-pjj-video-zone]');
        const bouton = carte.querySelector('[data-pjj-video-lancer]');
        if (!zone || !bouton)
            return;

        carte.dataset.pjjVideoChargee = 'oui';
        zone.classList.add('guide-video-zone-active');
        bouton.disabled = true;
        bouton.setAttribute('aria-busy', 'true');

        if (window.location.protocol === 'file:') {
            const url = `https://www.youtube.com/watch?v=${identifiant}`;
            const message = document.createElement('div');
            message.className = 'guide-video-local-message';
            const titre = document.createElement('strong');
            titre.textContent = 'Lecture locale';
            const explication = document.createElement('span');
            explication.textContent = 'La vidéo s’ouvre sur YouTube pendant les tests locaux. Sur pjjoue.fr, elle se lira directement dans cette carte.';
            message.append(titre, explication);
            zone.replaceChildren(message);
            envoyerAnalytics(carte, 'video_ouverte_youtube');
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.className = 'guide-video-lecteur';
        iframe.src = `https://www.youtube-nocookie.com/embed/${identifiant}?autoplay=1&rel=0`;
        iframe.title = carte.dataset.pjjVideoTitre || 'Vidéo YouTube';
        iframe.loading = 'lazy';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;

        zone.replaceChildren(iframe);
        envoyerAnalytics(carte, 'video_lancee');
    }

    function initialiser() {
        document.querySelectorAll(SELECTEUR).forEach((carte) => {
            const bouton = carte.querySelector('[data-pjj-video-lancer]');
            if (bouton) {
                const titre = String(carte.dataset.pjjVideoTitre || '').trim();
                bouton.setAttribute('aria-label', titre ? `Lire la vidéo : ${titre}` : 'Lire la vidéo');
                bouton.addEventListener('click', () => creerLecteur(carte), { once: true });
            }

            const lienExterne = carte.querySelector('.guide-video-lien');
            if (lienExterne)
                lienExterne.addEventListener('click', () => envoyerAnalytics(carte, 'video_ouverte_youtube'));
        });
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', initialiser, { once: true });
    else
        initialiser();
})();
