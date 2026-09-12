"""Captures avant/après, limitées à la branche de vérification de publication."""
import argparse
import json
import mimetypes
from pathlib import Path
from urllib.parse import unquote, urlparse

from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright
import verifier_regression_visuelle as recette


RACINE = Path(__file__).resolve().parents[1]
SORTIE = RACINE / 'test-results' / 'publication-accueil'
TAILLES = [(320, 568), (360, 800), (375, 667), (390, 844), (412, 915),
           (430, 932), (760, 1024), (844, 390), (1024, 768), (1440, 900)]
GRAINE = "let g=123456789;Math.random=()=>{g=(1103515245*g+12345)%2147483648;return g/2147483648;};"


def capturer_accueil(navigateur, racine, largeur, hauteur, nom):
    contexte = navigateur.new_context(viewport={'width': largeur, 'height': hauteur},
                                     device_scale_factor=1, service_workers='block')
    page = contexte.new_page()
    page.add_init_script(GRAINE)
    erreurs = []
    page.on('pageerror', lambda erreur: erreurs.append(str(erreur)))

    def servir(route):
        adresse = urlparse(route.request.url)
        if adresse.netloc != 'pjjoue.test':
            route.abort()
            return
        relatif = unquote(adresse.path).lstrip('/') or 'index.html'
        chemin = (racine / relatif).resolve()
        if racine in chemin.parents and chemin.is_file():
            route.fulfill(path=str(chemin), content_type=mimetypes.guess_type(chemin.name)[0])
        else:
            route.fulfill(status=404, body='Introuvable')

    page.route('**/*', servir)
    try:
        page.goto('http://pjjoue.test/', wait_until='load')
        refus = page.get_by_role('button', name='Refuser', exact=True)
        if refus.is_visible():
            refus.click()
        page.wait_for_function("document.body.dataset.ecranActif === 'accueil' && document.querySelector('.accueil-presentation-image').complete")
        page.evaluate('document.fonts.ready')
        page.add_style_tag(content='*{animation:none!important;transition:none!important;caret-color:transparent!important}')
        mesures = page.evaluate("""() => ({
            largeur: innerWidth, hauteur: innerHeight,
            debordement: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            entete: document.querySelector('header.entete').getBoundingClientRect().toJSON(),
            accueil: document.querySelector('#accueil').getBoundingClientRect().toJSON(),
            image: document.querySelector('.accueil-presentation-image').getBoundingClientRect().toJSON(),
            pied: document.querySelector('footer').getBoundingClientRect().toJSON(),
            imageChargee: document.querySelector('.accueil-presentation-image').naturalWidth > 0
        })""")
        capture = SORTIE / f'{nom}-{largeur}x{hauteur}.png'
        page.screenshot(path=str(capture))
        lien = page.get_by_role('link', name='Confidentialité', exact=True)
        lien.scroll_into_view_if_needed()
        position = lien.bounding_box()
        mesures['confidentialiteAccessible'] = bool(position and position['y'] >= 0
                                                  and position['y'] + position['height'] <= hauteur + 1)
        mesures['liensLegaux'] = page.locator('footer nav a').evaluate_all(
            "liens => liens.map(lien => ({texte:lien.textContent.trim(),href:lien.getAttribute('href')}))")
        page.screenshot(path=str(SORTIE / f'{nom}-{largeur}x{hauteur}-pied.png'))
        mesures['erreursJavaScript'] = erreurs
        return mesures, capture
    finally:
        contexte.close()


def principal():
    arguments = argparse.ArgumentParser()
    arguments.add_argument('--temoin', type=Path, required=True)
    temoin = arguments.parse_args().temoin.resolve()
    SORTIE.mkdir(parents=True, exist_ok=True)
    rapport = {'accueil': [], 'recette': [], 'nouvellesErreurs': []}
    with sync_playwright() as automate:
        navigateur = automate.chromium.launch(headless=True)
        for largeur, hauteur in TAILLES:
            try:
                avant, capture_avant = capturer_accueil(navigateur, temoin, largeur, hauteur, 'avant')
                apres, capture_apres = capturer_accueil(navigateur, RACINE, largeur, hauteur, 'apres')
                ligne = {'taille': [largeur, hauteur], 'avant': avant, 'apres': apres}
                rapport['accueil'].append(ligne)
                assert not apres['erreursJavaScript'], apres['erreursJavaScript']
                assert apres['imageChargee'], 'Image non chargée'
                assert apres['debordement'] <= 1, 'Débordement horizontal'
                assert apres['confidentialiteAccessible'], 'Lien Confidentialité hors écran après défilement'
                assert apres['liensLegaux'] == avant['liensLegaux'], 'Liens légaux modifiés'
                if largeur <= 760:
                    assert apres['image']['bottom'] >= hauteur - 1, 'Image trop courte'
                    assert apres['pied']['top'] >= hauteur - 1, 'Pied de page visible sans défiler'
                else:
                    difference = ImageChops.difference(Image.open(capture_avant).convert('RGB'),
                                                       Image.open(capture_apres).convert('RGB'))
                    ligne['pixelsIdentiques'] = difference.getbbox() is None
                    assert ligne['pixelsIdentiques'], 'Rendu hors téléphone modifié'
                print(f'OK accueil {largeur}x{hauteur}', flush=True)
            except Exception as erreur:
                rapport['nouvellesErreurs'].append(f'accueil {largeur}x{hauteur}: {erreur}')

        # La recette existante est exécutée entièrement, même lorsqu’un scénario
        # échoue. Toute erreur est rejouée sur la version témoin pour l’attribuer.
        recette.RACINE = RACINE
        html = recette.construire_page()
        recette.RACINE = temoin
        html_temoin = recette.construire_page()
        for scenario in recette.scenarios():
            resultat = {'scenario': scenario.nom}
            recette.RACINE = RACINE
            recette.SORTIE = SORTIE / 'recette'
            try:
                recette.verifier_scenario(navigateur, html, scenario, False, True)
                resultat['etat'] = 'réussi'
            except Exception as erreur:
                resultat['erreur'] = str(erreur)
                recette.RACINE = temoin
                recette.SORTIE = SORTIE / 'temoin-erreurs'
                try:
                    recette.verifier_scenario(navigateur, html_temoin, scenario, False, True)
                except Exception as erreur_temoin:
                    resultat['erreurTemoin'] = str(erreur_temoin)
                    resultat['etat'] = 'échec également sur témoin'
                else:
                    resultat['etat'] = 'nouvel échec'
                    rapport['nouvellesErreurs'].append(f'{scenario.nom}: {erreur}')
            rapport['recette'].append(resultat)
            print(json.dumps(resultat, ensure_ascii=False), flush=True)
        navigateur.close()
    (SORTIE / 'rapport.json').write_text(json.dumps(rapport, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assert not rapport['nouvellesErreurs'], rapport['nouvellesErreurs']
    print('OK — accueil contrôlé à 10 tailles et recette complète exécutée.', flush=True)


if __name__ == '__main__':
    principal()
