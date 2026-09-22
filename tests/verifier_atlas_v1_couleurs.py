#!/usr/bin/env python3
"""Recette ciblée Atlas V1 : couleurs contextuelles et lisibilité.

Utilise le vrai HTML/CSS/JS construit avec l'adaptateur de test Atlas.
Les progressions de maîtrise sont des fixtures locales au navigateur de test :
elles ne sont jamais ajoutées au produit ou à une sauvegarde de l'utilisatrice.
"""
from __future__ import annotations
import argparse
import json
import os
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from atlas_support import RACINE, construire_page_atlas
from verifier_atlas import verifier_geometrie, fermer_fenetres

PREPARER_MAITRISE = """() => {
 for (const theme of THEMES) {
  for (const etape of PROGRAMMES[theme.id].etapes) {
   const bilan = obtenirBilanEtape(theme.id, etape.id);
   bilan.nombreTentatives=1; bilan.meilleurScore=100;
   bilan.termineeSansJoker=true; bilan.jokersUtilises=false;
   bilan.celebrationSansJokerAffichee=true;
   for (const q of obtenirQuestionsEtape(theme.id, etape.id)) {
    bilan.questionsTraitees[q.id]=true; bilan.resultats[q.id]=true;
    bilan.validationsSansJoker[q.id]=true;
   }
  }
  obtenirEvaluationFinaleTheme(theme.id).reussie=true;
  obtenirEvaluationFinaleTheme(theme.id).meilleurScore=100;
 }
 for (const n of numerosEtapesSigles('tous')) {
  const e=obtenirEtatEtapeSigles(n);
  for (const s of obtenirSiglesEtape(n)) {
   const cle=normaliserSigleJeu(s.sigle);
   e.autonomes[cle]=true; e.validationsSansJoker[cle]=true;
   marquerSigleIntroduit(s.sigle);
  }
 }
 for (const n of numerosEtapesMissionMesures()) {
  const e=obtenirEtatEtapeMesures(n);
  for (const s of obtenirReperesMesuresEtape(n)) {
   const cle=normaliserCleMesure(s.cle);
   e.autonomes[cle]=true; e.validationsSansJoker[cle]=true;
   marquerRepereMesureIntroduit(s.cle);
  }
 }
 actualiserSelecteurParcours();
} """

LIRE_ETOILES = """({selecteur, variable, compte}) => {
 const attenduRGB=hex=>`rgb(${hex.slice(1).match(/.{2}/g).map(x=>parseInt(x,16)).join(', ')})`;
 return [...document.querySelectorAll(selecteur)].map(carte=>{
  const etoile=carte.querySelector('.etoile-filante-progression');
  if (!etoile) throw Error('Étoile manquante : '+(carte.dataset.theme||carte.dataset.etape||carte.className));
  const couleur=attenduRGB(getComputedStyle(carte).getPropertyValue(variable).trim());
  const points=[etoile,...etoile.querySelectorAll('path')];
  const couleurs=points.map(el=>el.tagName.toLowerCase()==='path'
    ? getComputedStyle(el).getPropertyValue(el.classList.contains('etoile-filante-astre')?'fill':'stroke')
    : getComputedStyle(el).color);
  if (couleurs.some(c=>c!==couleur)) throw Error(JSON.stringify({couleur,couleurs}));
  const chiffre=etoile.querySelector('b');
  if (Boolean(chiffre)!==compte) throw Error('Compteur de maîtrise incorrect.');
  if (chiffre && chiffre.textContent!=='12') throw Error('Le compte de maîtrise a changé.');
  const r=etoile.getBoundingClientRect();
  const voisin=carte.querySelector('.chemin-etape-texte,.sigles-etape-numero,.mesures-etape-numero,.q-chapter-bottom>span');
  const v=voisin?.getBoundingClientRect();
  if (v && Math.min(r.right,v.right)-Math.max(r.left,v.left)>1 && Math.min(r.bottom,v.bottom)-Math.max(r.top,v.top)>1)
    throw Error('Étoile et texte se chevauchent.');
  return {couleur,compteur:chiffre?.textContent||null};
 });
}"""


def etoiles(page):
    assert page.locator('.etoile-filante-progression').count()==0
    page.evaluate(PREPARER_MAITRISE)
    resultats=[]
    for ecran, zone in [('accueil','#catalogueAtlas'),('parcours','#selecteurParcours')]:
        page.evaluate('e=>afficherEcran(e)',ecran)
        if ecran=='parcours': page.evaluate('ouvrirChoixParcours()')
        r=page.evaluate(LIRE_ETOILES,dict(selecteur=zone+' .q-chapter',variable='--parcours-accent',compte=True))
        assert len(r)==6
        resultats.extend(r); verifier_geometrie(page)
    for theme in page.evaluate('THEMES.map(t=>t.id)'):
        page.evaluate('t=>ouvrirParcours(t)',theme)
        r=page.evaluate(LIRE_ETOILES,dict(selecteur='.chemin-etape-carte',variable='--couleur-etape',compte=False))
        assert len(r)==11
        resultats.extend(r)
        r=page.evaluate(LIRE_ETOILES,dict(selecteur='#carteEvaluationFinale',variable='--couleur-etape',compte=False))
        assert len(r)==1
        resultats.extend(r); verifier_geometrie(page)
    page.evaluate("afficherEcran('sigles'); choisirDomaineSigles('tous')")
    page.locator('#siglesOuvrirParcours').click()
    r=page.evaluate(LIRE_ETOILES,dict(selecteur='article.sigles-etape-carte',variable='--sigles-etape-accent',compte=False))
    assert len(r)==9
    resultats.extend(r); verifier_geometrie(page)
    page.evaluate("afficherEcran('mesures')")
    page.locator('#mesuresOuvrirParcours').click()
    r=page.evaluate(LIRE_ETOILES,dict(selecteur='article.mesures-etape-carte',variable='--mesures-etape-accent',compte=False))
    assert len(r)==12
    resultats.extend(r); verifier_geometrie(page)
    assert len(resultats)==105
    return {'etoiles_contextuelles':len(resultats),'couleurs_distinctes':len({x['couleur'] for x in resultats})}


def coherence(page):
    r=page.evaluate("""() => {
      const rapports=[];
      for (const theme of THEMES) for (const etape of PROGRAMMES[theme.id].etapes) {
       const attendu=obtenirCouleurEtapeAtlas(theme.id,etape.id);
       const q=obtenirQuestionsEtape(theme.id,etape.id)[0];
       appliquerIdentiteVisuelleEtape(q);
       const actif=document.documentElement.style.getPropertyValue('--couleur-etape-active');
       const fragment=document.createElement('div');
       fragment.innerHTML=construireReperesRevision('parcours',{cible:q});
       const revision=fragment.querySelectorAll('.revision-repere')[1].style.getPropertyValue('--repere-accent');
       ouvrirParcours(theme.id);
       const carte=document.querySelector(`.chemin-etape-carte[data-etape="${etape.id}"]`);
       const couleur=carte.style.getPropertyValue('--couleur-etape');
       if (actif!==attendu || revision!==attendu || couleur!==attendu)
         throw Error(JSON.stringify({theme:theme.id,etape:etape.id,attendu,actif,revision,couleur}));
       rapports.push({theme:theme.id,etape:etape.id,couleur});
      }
      return rapports;
    }""")
    assert len(r)==66
    return {'etapes_carte_question_revision':len(r)}


def typographie(page):
    def taille(selector):
        return page.locator(selector).first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')
    assert abs(taille('#qc-atlas')-19.55)<.1  # Grande est désormais le défaut demandé.
    page.evaluate("afficherEcran('parametres')")
    page.locator('#boutonTailleTexteNormale').click()
    page.evaluate("afficherEcran('accueil')")
    avant=taille('.q-hero h1')
    assert taille('#qc-atlas')==17
    assert taille('.q-hero-copy>p')==17
    nav=taille('#boutonParcoursPJJ')
    assert nav==(14 if page.viewport_size['width']<=800 else 15.5),nav
    assert taille('.q-chapter h3')==17
    assert taille('.q-chapter-bottom')>=14
    page.evaluate("afficherEcran('parametres')")
    page.locator('#boutonTailleTexteGrande').click()
    page.evaluate("afficherEcran('accueil')")
    assert abs(taille('#qc-atlas')-19.55)<.1
    assert taille('.q-hero h1')>=avant  # Le grand titre conserve sa borne responsive d'origine.
    verifier_geometrie(page)
    page.locator('#boutonMenuMobile').click()
    assert page.locator('#menuPrincipal').is_visible()
    assert taille('#menuPrincipal button')>=18
    verifier_geometrie(page)
    page.keyboard.press('Escape')
    for ecran in ['entrainement','supports','erreurs','progression','sigles','mesures','parametres']:
        page.evaluate('e=>afficherEcran(e)',ecran); fermer_fenetres(page)
        verifier_geometrie(page)
    page.locator('#boutonTailleTexteNormale').click()
    page.evaluate("afficherEcran('accueil')")
    assert taille('#qc-atlas')==17 and taille('.q-hero h1')==avant
    return {'texte_normal_px':17,'menu_px':nav,'agrandissement_115_pourcent':True,'pages_agrandies':8}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--captures',action='store_true')
    args=parser.parse_args()
    sortie=RACINE/'test-results/atlas-v1-couleurs';sortie.mkdir(parents=True,exist_ok=True)
    html=construire_page_atlas(); lignes=[]
    executable=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or shutil.which('chromium')
    with sync_playwright() as p:
        options={'headless':True,'args':['--no-sandbox']}
        if executable: options['executable_path']=executable
        browser=p.chromium.launch(**options)
        for width in [1440,768,390,320]:
            for nom,fonction in [('etoiles',etoiles),('coherence',coherence),('typographie',typographie)]:
                page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
                erreurs=[];page.on('pageerror',lambda e:erreurs.append(str(e)))
                ligne={'largeur':width,'controle':nom}
                try:
                    page.set_content(html,wait_until='domcontentloaded')
                    ligne.update(fonction(page));assert not erreurs,erreurs
                    ligne['ok']=True
                    if args.captures and nom=='etoiles':
                        for theme in ['procedure_ordinaire','commun']:
                            page.evaluate('t=>ouvrirParcours(t)',theme)
                            page.evaluate('document.activeElement?.blur()')
                            page.screenshot(path=str(sortie/f'{width}-etoiles-{theme}.png'),full_page=True)
                        page.evaluate("afficherEcran('accueil'); document.activeElement?.blur()")
                        page.screenshot(path=str(sortie/f'{width}-etoiles-parcours.png'),full_page=True)
                    print('OK',width,nom,flush=True)
                except Exception as erreur:
                    import traceback
                    traceback.print_exc()
                    ligne.update(ok=False,erreur=str(erreur))
                    print('ECHEC',width,nom,str(erreur),flush=True)
                    page.screenshot(path=str(sortie/f'ECHEC-{width}-{nom}.png'),full_page=True)
                finally:
                    lignes.append(ligne);page.close()
        browser.close()
    (sortie/'rapport.json').write_text(json.dumps(lignes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    reussis=sum(x['ok'] for x in lignes)
    print(f'{reussis}/{len(lignes)} scénarios couleurs, étoiles et lisibilité validés.')
    return 0 if reussis==len(lignes) else 1
if __name__=='__main__':raise SystemExit(main())
