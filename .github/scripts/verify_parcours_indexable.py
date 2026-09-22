from pathlib import Path
import subprocess
import time
from playwright.sync_api import sync_playwright

root = Path.cwd()
parcours = (root / "parcours/index.html").read_text(encoding="utf-8")
assert '<meta content="index,follow,max-image-preview:large" name="robots"/>' in parcours
assert '<link href="https://pjjoue.fr/parcours/" rel="canonical"/>' in parcours
assert '<meta content="https://pjjoue.fr/parcours/" property="og:url"/>' in parcours
assert '<meta http-equiv="refresh"' not in parcours
assert "<title>Parcours CJPM : quiz pour réviser le CJPM | Quiz CJPM</title>" in parcours
assert '<base href="../"/>' in parcours

sitemap = (root / "sitemap.xml").read_text(encoding="utf-8")
assert sitemap.count("<loc>") == 22
assert sitemap.count("<loc>https://pjjoue.fr/parcours/</loc>") == 1

entrainement = (root / "entrainement/index.html").read_text(encoding="utf-8")
assert 'content="noindex,follow"' in entrainement
assert '<link rel="canonical" href="https://pjjoue.fr/">' in entrainement

index = (root / "index.html").read_text(encoding="utf-8")
assert index.count('id="boutonAccueil"') == 1
assert index.find('id="boutonAccueil"') < index.find('id="boutonParcoursPJJ"')
guides = (root / "guides/index.html").read_text(encoding="utf-8")
assert '<a href="../index.html">Accueil</a><a href="../index.html#parcours">Parcours CJPM</a>' in guides

serveur = subprocess.Popen(
    ["python", "-m", "http.server", "8765", "--bind", "127.0.0.1"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
try:
    time.sleep(0.5)
    with sync_playwright() as p:
        navigateur = p.chromium.launch(headless=True, args=["--no-sandbox"])
        for largeur, hauteur in ((1365, 900), (390, 844)):
            page = navigateur.new_page(viewport={"width": largeur, "height": hauteur})
            erreurs = []
            page.on("pageerror", lambda erreur: erreurs.append(str(erreur)))
            page.goto("http://127.0.0.1:8765/parcours/", wait_until="domcontentloaded")
            page.wait_for_function("() => window.DONNEES_PJJ?.QUESTIONS?.length === 960")
            page.wait_for_function("() => document.body.dataset.ecranActif === 'parcours'")
            page.wait_for_timeout(250)
            assert page.locator("#parcours.actif").is_visible()
            assert page.locator("#boutonAccueil").is_visible()
            assert page.title() == "Parcours CJPM : quiz pour réviser le CJPM | Quiz CJPM"
            assert page.url.endswith("/parcours/")
            fond = page.locator("#qc-atlas").evaluate("e => getComputedStyle(e).backgroundColor")
            assert fond == "rgb(244, 240, 232)", fond
            assert not erreurs, erreurs
            page.close()
        navigateur.close()
finally:
    serveur.terminate()
    serveur.wait(timeout=5)

print("OK — /parcours/ indexable, Accueil visible dans le menu et fond beige éclairci.")
