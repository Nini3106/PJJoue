from pathlib import Path
import re

root = Path.cwd()

# Application principale
p = root / "code/01 - Éléments communs/gabarit-page-principale.html"
s = p.read_text(encoding="utf-8")
old = '<div class="navigation q-pop" id="menuPrincipal">\n<button data-ecran="progression" id="boutonProgression" type="button">Ma progression</button>'
mobile = '''<div class="navigation q-pop" id="menuPrincipal">
<button class="menu-mobile-seulement" data-ecran="accueil" type="button">Accueil</button>
<button class="menu-mobile-seulement" data-ecran="parcours" type="button">Parcours CJPM</button>
<button class="menu-mobile-seulement" data-ecran="entrainement" type="button">S’entraîner</button>
<button class="menu-mobile-seulement" data-ecran="erreurs" type="button">Réviser</button>
<button class="menu-mobile-seulement" data-ecran="supports" type="button">Ressources</button>
<span aria-hidden="true" class="menu-mobile-separateur"></span>
<button data-ecran="progression" id="boutonProgression" type="button">Ma progression</button>'''
assert s.count(old) == 1
p.write_text(s.replace(old, mobile, 1), encoding="utf-8")

# Pages autonomes
pages_modifiees = 0
for p in root.glob("code/**/*.html"):
    if p.name == "gabarit-page-principale.html":
        continue
    s = p.read_text(encoding="utf-8")
    if 'class="atlas-static-menu q-more"' not in s or 'menu-mobile-seulement' in s:
        continue
    m = re.search(r'<a href="([^"]*index\.html)#parcours">Parcours CJPM</a>', s)
    if not m:
        continue
    accueil = m.group(1)
    old = '<div class="q-pop"><a href="' + accueil + '#progression">Ma progression</a>'
    if old not in s:
        continue
    insert = (
        '<div class="q-pop">'
        f'<a class="menu-mobile-seulement" href="{accueil}">Accueil</a>'
        f'<a class="menu-mobile-seulement" href="{accueil}#parcours">Parcours CJPM</a>'
        f'<a class="menu-mobile-seulement" href="{accueil}#entrainement">S’entraîner</a>'
        f'<a class="menu-mobile-seulement" href="{accueil}#erreurs">Réviser</a>'
        f'<a class="menu-mobile-seulement" href="{accueil}#supports">Ressources</a>'
        '<span aria-hidden="true" class="menu-mobile-separateur"></span>'
        f'<a href="{accueil}#progression">Ma progression</a>'
    )
    p.write_text(s.replace(old, insert, 1), encoding="utf-8")
    pages_modifiees += 1
assert pages_modifiees >= 15, pages_modifiees

# Styles partagés
p = root / "code/01 - Éléments communs/atlas-systeme.css"
s = p.read_text(encoding="utf-8")
anchor = '#qc-atlas .q-more{position:relative}\n'
assert s.count(anchor) == 1
s = s.replace(anchor, anchor + '#qc-atlas :is(.menu-mobile-seulement,.menu-mobile-separateur){display:none}\n', 1)

marker = '@media (max-width:640px) {\n #qc-atlas :is(.page-entete,.presentation-page,.parcours-detail-entete) h1'
assert s.count(marker) == 1
mobile_css = '''@media (max-width:640px) {
 #qc-atlas .q-header {
   min-height:68px;
   padding:12px 16px;
   align-items:center;
   gap:12px;
 }
 #qc-atlas .q-identity { gap:10px; }
 #qc-atlas .q-tagline { display:none; }
 #qc-atlas .q-nav {
   width:auto;
   margin-left:auto;
   justify-content:flex-end;
   flex-wrap:nowrap;
 }
 #qc-atlas .q-nav > :is(button,a):not(.bouton-menu-mobile) { display:none; }
 #qc-atlas .q-more { position:static; margin-left:auto; }
 #qc-atlas .bouton-menu-mobile,
 #qc-atlas .atlas-static-menu > summary {
   min-width:92px;
   border:1px solid color-mix(in srgb,var(--q-paper) 38%,transparent);
   background:color-mix(in srgb,var(--q-paper) 9%,var(--q-menu-fond));
   border-radius:8px;
   padding:9px 12px;
 }
 #qc-atlas .bouton-menu-mobile .bouton-menu-libelle { display:none; }
 #qc-atlas .bouton-menu-mobile::before { content:"Menu"; }
 #qc-atlas .bouton-menu-mobile[aria-expanded="true"]::before { content:"Fermer"; }
 #qc-atlas .atlas-static-menu > summary { font-size:0; list-style:none; }
 #qc-atlas .atlas-static-menu > summary::-webkit-details-marker { display:none; }
 #qc-atlas .atlas-static-menu > summary::before {
   content:"Menu";
   font-size:var(--q-text-nav);
 }
 #qc-atlas .atlas-static-menu[open] > summary::before { content:"Fermer"; }
 #qc-atlas .atlas-static-menu > summary > span,
 #qc-atlas .bouton-menu-mobile > span[aria-hidden="true"] {
   font-size:var(--q-text-nav);
   transition:transform .18s ease;
 }
 #qc-atlas .atlas-static-menu[open] > summary > span,
 #qc-atlas .bouton-menu-mobile[aria-expanded="true"] > span[aria-hidden="true"] {
   transform:rotate(180deg);
 }
 #qc-atlas :is(#menuPrincipal,.atlas-static-menu .q-pop) {
   left:12px;
   right:12px;
   top:calc(100% + 8px);
   width:auto;
   min-width:0;
   max-width:none;
   max-height:calc(100dvh - 92px);
   overflow-y:auto;
   padding:9px;
   border:1px solid color-mix(in srgb,var(--q-menu-fond) 18%,var(--q-line));
   border-top:4px solid var(--q-yellow);
   border-radius:12px;
   background:var(--q-paper);
   box-shadow:0 16px 38px rgba(23,45,72,.22);
 }
 #qc-atlas :is(#menuPrincipal,.atlas-static-menu .q-pop)::before {
   content:"Navigation";
   display:block;
   padding:6px 10px 9px;
   color:var(--q-muted);
   font-size:var(--q-text-small);
   font-weight:700;
   letter-spacing:.08em;
   text-transform:uppercase;
 }
 #qc-atlas :is(#menuPrincipal,.atlas-static-menu .q-pop) :is(button,a) {
   width:100%;
   min-height:46px;
   display:flex;
   justify-content:flex-start;
   align-items:center;
   padding:10px 12px;
   border:0;
   border-radius:7px;
   background:transparent;
   color:var(--q-ink);
   font-size:var(--q-text-control);
   font-weight:600;
   text-decoration:none;
 }
 #qc-atlas :is(#menuPrincipal,.atlas-static-menu .q-pop) :is(button,a):hover,
 #qc-atlas :is(#menuPrincipal,.atlas-static-menu .q-pop) :is(button,a):focus-visible,
 #qc-atlas :is(#menuPrincipal,.atlas-static-menu .q-pop) [aria-current="page"] {
   background:color-mix(in srgb,var(--q-menu-fond) 8%,var(--q-paper));
 }
 #qc-atlas :is(#menuPrincipal,.atlas-static-menu .q-pop) :is(button,a)[aria-current="page"] {
   box-shadow:inset 3px 0 var(--q-blue);
 }
 #qc-atlas .menu-mobile-seulement { display:flex; }
 #qc-atlas .menu-mobile-separateur {
   display:block;
   height:1px;
   margin:7px 8px;
   background:color-mix(in srgb,var(--q-menu-fond) 16%,transparent);
 }
}
'''
p.write_text(s.replace(marker, mobile_css + marker, 1), encoding="utf-8")

# Ancien empilement mobile de l'application
p = root / "code/01 - Éléments communs/style-general-pjjoue.css"
s = p.read_text(encoding="utf-8")
old = '''@media (max-width:640px) {
 #qc-atlas .q-header { align-items:flex-start; }
 #qc-atlas .q-nav { width:100%; justify-content:flex-start; gap:4px; flex-wrap:wrap; }
  #qc-atlas .q-more { margin-left:0; position:static; }
 #qc-atlas #menuPrincipal { left:17px; right:auto; top:calc(100% - 6px); }
'''
new = '''@media (max-width:640px) {
 #qc-atlas .q-header { align-items:center; }
 #qc-atlas .q-nav { width:auto; justify-content:flex-end; gap:0; flex-wrap:nowrap; }
 #qc-atlas .q-more { margin-left:auto; position:static; }
 #qc-atlas #menuPrincipal { left:12px; right:12px; top:calc(100% + 8px); width:auto; max-width:none; }
'''
assert s.count(old) == 1
p.write_text(s.replace(old, new, 1), encoding="utf-8")

# Test de finition adapté à la navigation mobile
p = root / "tests/verifier_finitions_v1.py"
s = p.read_text(encoding="utf-8")
old = """        page.keyboard.press('Escape');assert not page.locator('#menuPrincipal').is_visible()
        page.locator('#boutonParcoursPJJ').click()
        assert page.locator('#boutonParcoursPJJ').evaluate('e=>getComputedStyle(e).color')=='rgb(244, 239, 230)'
"""
new = """        page.keyboard.press('Escape');assert not page.locator('#menuPrincipal').is_visible()
        bouton_parcours=page.locator('#boutonParcoursPJJ')
        if bouton_parcours.is_visible():
            bouton_parcours.click()
            assert bouton_parcours.evaluate('e=>getComputedStyle(e).color')=='rgb(244, 239, 230)'
        else:
            page.locator('#boutonMenuMobile').click()
            page.locator('#menuPrincipal [data-ecran="parcours"]').click()
"""
assert s.count(old) == 1
p.write_text(s.replace(old, new, 1), encoding="utf-8")

print(f"Menu mobile préparé, {pages_modifiees} pages autonomes adaptées.")
