from pathlib import Path
import json
import re

root = Path.cwd()

def remplacer_unique(texte, ancien, nouveau, contexte):
    nombre = texte.count(ancien)
    assert nombre == 1, f"{contexte}: attendu 1 occurrence, trouvé {nombre}"
    return texte.replace(ancien, nouveau, 1)

# 1) Bouton Accueil dans la navigation principale de l'application.
gabarit = root / "code/01 - Éléments communs/gabarit-page-principale.html"
texte = gabarit.read_text(encoding="utf-8")
bouton_accueil = '<button data-ecran="accueil" id="boutonAccueil" type="button">Accueil</button>\n'
texte = remplacer_unique(
    texte,
    '<nav aria-label="Navigation principale" class="navigation q-nav">\n<button data-ecran="parcours" id="boutonParcoursPJJ" type="button">Parcours CJPM</button>',
    '<nav aria-label="Navigation principale" class="navigation q-nav">\n' + bouton_accueil + '<button data-ecran="parcours" id="boutonParcoursPJJ" type="button">Parcours CJPM</button>',
    "navigation principale",
)
texte = remplacer_unique(
    texte,
    bouton_accueil + '<button data-ecran="progression" id="boutonProgression" type="button">Ma progression</button>',
    '<button data-ecran="progression" id="boutonProgression" type="button">Ma progression</button>',
    "ancien bouton Accueil dans Plus",
)
gabarit.write_text(texte, encoding="utf-8")

# 2) Bouton Accueil dans la barre de navigation de toutes les pages autonomes.
motif_nav = re.compile(
    r'(<nav aria-label="Navigation principale" class="q-nav">)'
    r'(<a href="([^"]*index\.html)#parcours">Parcours CJPM</a>)'
)
pages_modifiees = []
for chemin in sorted((root / "code").rglob("*.html")):
    if chemin == gabarit:
        continue
    source = chemin.read_text(encoding="utf-8")
    nouveau, nombre = motif_nav.subn(
        lambda m: m.group(1) + f'<a href="{m.group(3)}">Accueil</a>' + m.group(2),
        source,
        count=1,
    )
    if nombre:
        chemin.write_text(nouveau, encoding="utf-8")
        pages_modifiees.append(chemin.relative_to(root).as_posix())
assert len(pages_modifiees) >= 15, f"Seulement {len(pages_modifiees)} pages autonomes ont reçu Accueil"

# 3) Fond beige deux tons plus clair.
palette = root / "code/01 - Éléments communs/atlas-systeme.css"
css = palette.read_text(encoding="utf-8")
css = remplacer_unique(css, 'background:#eae3d5;', 'background:#f4f0e8;', "fond racine")
css = remplacer_unique(css, '--q-paper:light-dark(#eae3d5,#171d29);', '--q-paper:light-dark(#f4f0e8,#171d29);', "papier clair")
css = remplacer_unique(css, '--q-paper-profond:light-dark(#ddd3bf,#121925);', '--q-paper-profond:light-dark(#ebe4d8,#121925);', "papier profond")
palette.write_text(css, encoding="utf-8")

# 4) /parcours/ devient une vraie page indexable qui charge l'application.
constructeur = root / "outils/construire_site.py"
source = constructeur.read_text(encoding="utf-8")
source = remplacer_unique(source, 'import argparse\n', 'import argparse\nimport base64\n', "import base64")

fonction = r'''
def construire_page_parcours_indexable(page_principale: str) -> str:
    """Construit /parcours/ comme vraie entrée indexable de l'application."""
    titre = "Parcours CJPM : quiz pour réviser le CJPM | Quiz CJPM"
    description = (
        "Explore 5 parcours de quiz pour réviser le CJPM, de l’enquête à l’exécution "
        "des peines, plus une option pour découvrir la PJJ."
    )
    url = "https://pjjoue.fr/parcours/"
    page = page_principale

    if page.count('<base href="./"/>') != 1:
        raise ErreurConstruction("La base de l'application est introuvable pour construire /parcours/.")
    page = page.replace('<base href="./"/>', '<base href="../"/>', 1)

    page, nombre = re.subn(
        r"<title>.*?</title>",
        f"<title>{html.escape(titre)}</title>",
        page,
        count=1,
        flags=re.S,
    )
    if nombre != 1:
        raise ErreurConstruction("La balise title de l'application est introuvable pour /parcours/.")

    def remplacer_meta(contenu: str, attribut: str, cle: str, valeur: str) -> str:
        motif = re.compile(r"<meta\b[^>]*>", re.I)
        compteur = 0

        def remplacer(correspondance):
            nonlocal compteur
            balise = correspondance.group(0)
            if not re.search(rf'\b{re.escape(attribut)}="{re.escape(cle)}"', balise, re.I):
                return balise
            compteur += 1
            nouvelle, nb = re.subn(
                r'\bcontent="[^"]*"',
                f'content="{html.escape(valeur, quote=True)}"',
                balise,
                count=1,
            )
            if nb != 1:
                raise ErreurConstruction(f"Attribut content absent pour {attribut}={cle} dans /parcours/.")
            return nouvelle

        resultat = motif.sub(remplacer, contenu)
        if compteur != 1:
            raise ErreurConstruction(f"Meta {attribut}={cle} attendue une fois pour /parcours/, trouvée {compteur}.")
        return resultat

    page = remplacer_meta(page, "name", "description", description)
    page = remplacer_meta(page, "property", "og:title", titre)
    page = remplacer_meta(page, "property", "og:description", description)
    page = remplacer_meta(page, "property", "og:url", url)
    page = remplacer_meta(page, "name", "twitter:title", titre)
    page = remplacer_meta(page, "name", "twitter:description", description)

    motif_canonical = re.compile(r'<link\b[^>]*\brel="canonical"[^>]*>', re.I)
    correspondances = list(motif_canonical.finditer(page))
    if len(correspondances) != 1:
        raise ErreurConstruction(f"Canonical de /parcours/ attendu une fois, trouvé {len(correspondances)}.")
    balise = correspondances[0].group(0)
    nouvelle_balise, nb = re.subn(r'href="[^"]*"', f'href="{url}"', balise, count=1)
    if nb != 1:
        raise ErreurConstruction("href canonical absent pour /parcours/.")
    page = page[:correspondances[0].start()] + nouvelle_balise + page[correspondances[0].end():]

    motif_jsonld = re.compile(
        r'(<script\b[^>]*\btype="application/ld\+json"[^>]*>)(.*?)(</script>)',
        re.S | re.I,
    )
    blocs = list(motif_jsonld.finditer(page))
    if len(blocs) != 1:
        raise ErreurConstruction(f"JSON-LD de l'application attendu une fois pour /parcours/, trouvé {len(blocs)}.")
    ancien_jsonld = blocs[0].group(2)
    donnees = {
        "@context": "https://schema.org",
        "@type": ["CollectionPage", "LearningResource"],
        "@id": "https://pjjoue.fr/parcours/#webpage",
        "url": url,
        "name": titre,
        "description": description,
        "inLanguage": "fr-FR",
        "dateModified": "2026-09-22",
        "isPartOf": {
            "@type": "WebSite",
            "@id": "https://pjjoue.fr/#website",
            "name": "Quiz CJPM",
            "url": "https://pjjoue.fr/",
        },
        "about": {
            "@type": "Thing",
            "name": "Code de la justice pénale des mineurs",
            "alternateName": "CJPM",
        },
        "learningResourceType": ["Quiz", "Parcours d’apprentissage"],
        "educationalUse": ["Révision", "Autoévaluation"],
    }
    nouveau_jsonld = json.dumps(donnees, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    page = motif_jsonld.sub(lambda m: m.group(1) + nouveau_jsonld + m.group(3), page, count=1)
    nouvelle_empreinte = base64.b64encode(hashlib.sha256(nouveau_jsonld.encode("utf-8")).digest()).decode("ascii")
    marqueur_nouveau = "'sha256-" + nouvelle_empreinte + "'"
    repere_csp = " https://www.googletagmanager.com; style-src"
    if page.count(repere_csp) != 1:
        raise ErreurConstruction("La directive script-src CSP de /parcours/ est introuvable.")
    if marqueur_nouveau not in page:
        page = page.replace(
            repere_csp,
            f" {marqueur_nouveau} https://www.googletagmanager.com; style-src",
            1,
        )
    return page


'''
repere = '\ndef construire_relais_routes() -> dict[str, str]:\n'
assert source.count(repere) == 1
source = source.replace(repere, '\n' + fonction + 'def construire_relais_routes() -> dict[str, str]:\n', 1)
source = remplacer_unique(
    source,
    '        if not route:\n            continue\n        profondeur = len(route.split("/"))',
    '        if not route or route == "parcours":\n            continue\n        profondeur = len(route.split("/"))',
    "exclusion du relais /parcours/",
)
source = remplacer_unique(
    source,
    '    ajouter("index.html", construire_page_principale(plan))\n\n    for sortie, contenu in construire_relais_routes().items():',
    '    page_principale = construire_page_principale(plan)\n    ajouter("index.html", page_principale)\n    ajouter("parcours/index.html", construire_page_parcours_indexable(page_principale))\n\n    for sortie, contenu in construire_relais_routes().items():',
    "construction de /parcours/",
)
constructeur.write_text(source, encoding="utf-8")

# 5) SEO : /parcours/ devient la 22e URL indexable.
seo = root / "outils/construire_seo.py"
source = seo.read_text(encoding="utf-8")
source = remplacer_unique(
    source,
    '    sorties = {"index.html"}\n',
    '    sorties = {"index.html", "parcours/index.html"}\n',
    "sorties SEO",
)
source = remplacer_unique(
    source,
    '    chemins = {route.strip("/") for route in routes.values() if route.strip("/")}\n',
    '    chemins = {route.strip("/") for route in routes.values() if route.strip("/") and route.strip("/") != "parcours"}\n',
    "relais SEO",
)
source = remplacer_unique(
    source,
    '    if sortie == "index.html":\n        if analyse.h1 < 1:\n            raise SystemExit("ÉCHEC SEO — l’accueil doit conserver au moins un H1.")\n',
    '    if sortie in {"index.html", "parcours/index.html"}:\n        if analyse.h1 < 1:\n            raise SystemExit(f"ÉCHEC SEO — {sortie} doit conserver au moins un H1.")\n',
    "contrôle H1 application",
)
seo.write_text(source, encoding="utf-8")

config_path = root / "code/seo-pages.json"
config = json.loads(config_path.read_text(encoding="utf-8"))
assert len(config["pages"]) == 21
assert not any(p["sortie"] == "parcours/index.html" for p in config["pages"])
config["pages"].insert(1, {
    "sortie": "parcours/index.html",
    "url": "https://pjjoue.fr/parcours/",
    "lastmod": "2026-09-22",
})
config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# Titre navigateur cohérent sur la route Parcours.
navigation = root / "code/01 - Éléments communs/JavaScript - Navigation et fenêtres.js"
js = navigation.read_text(encoding="utf-8")
js = remplacer_unique(
    js,
    "    document.title = ecran === 'accueil'\n        ? 'Quiz CJPM : réviser la justice pénale des mineurs'\n        : \x60\x24{TITRES_ECRANS[ecran] || 'Quiz CJPM'} — Quiz CJPM\x60;",
    "    document.title = ecran === 'accueil'\n        ? 'Quiz CJPM : réviser la justice pénale des mineurs'\n        : ecran === 'parcours'\n            ? 'Parcours CJPM : quiz pour réviser le CJPM | Quiz CJPM'\n            : \x60\x24{TITRES_ECRANS[ecran] || 'Quiz CJPM'} — Quiz CJPM\x60;",
    "titre dynamique Parcours",
)
navigation.write_text(js, encoding="utf-8")

# /parcours/ dans les ressources applicatives.
sw = root / "code/01 - Éléments communs/Application installable et hors connexion/service-worker.js"
sw_text = sw.read_text(encoding="utf-8")
sw_text = remplacer_unique(
    sw_text,
    "  './index.html',\n",
    "  './index.html',\n  './parcours/index.html',\n",
    "précache /parcours/",
)
sw.write_text(sw_text, encoding="utf-8")

rapport = {
    "pagesAutonomesAvecAccueil": len(pages_modifiees),
    "nouveauFond": {"papier": "#f4f0e8", "profond": "#ebe4d8"},
    "pageParcoursIndexable": "https://pjjoue.fr/parcours/",
    "pagesIndexablesAttendues": 22,
}
Path("test-results/parcours-indexable").mkdir(parents=True, exist_ok=True)
Path("test-results/parcours-indexable/modifications.json").write_text(
    json.dumps(rapport, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(json.dumps(rapport, ensure_ascii=False, indent=2))
