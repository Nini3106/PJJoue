#!/usr/bin/env python3
"""Recette V1 : barre unique, texte Grande et sélections contextuelles.
Les vraies sources sont exécutées dans Chromium. Les valeurs de progression
utilisées pour afficher les filtres n'existent que dans le navigateur de test.
Même limite que la recette existante : origine en mémoire, stockage de test.
"""
from pathlib import Path
import argparse,json,sys,os
from playwright.sync_api import sync_playwright
from atlas_support import construire_page_atlas,RACINE
from verifier_atlas import verifier_geometrie,fermer_fenetres,QUESTION,MODES

SORTIE=RACINE/'test-results/finitions-v1'
SORTIE.mkdir(parents=True,exist_ok=True)

# Comparer les valeurs calculées à un témoin CSS évite la dépendance à la
# sérialisation rgb()/color(srgb ...) propre à une version de navigateur.
STYLE='''(arg) => {
 const e=document.querySelector(arg.sel); if(!e)throw Error('Élément absent '+arg.sel);
 const probe=document.createElement('span');document.body.appendChild(probe);
 probe.style.color=arg.accent;
 const accent=getComputedStyle(probe).color;
 probe.style.backgroundColor=`color-mix(in srgb,${arg.accent} ${arg.part}%,var(--q-panel))`;
 const fond=getComputedStyle(probe).backgroundColor;probe.remove();
 const reel=getComputedStyle(e);
 if(reel[arg.bord||'borderLeftColor']!==accent)throw Error(JSON.stringify({sel:arg.sel,attendu:accent,reel:reel[arg.bord||'borderLeftColor']}));
 if(arg.fond!==false && reel.backgroundColor!==fond)throw Error(JSON.stringify({sel:arg.sel,fond,reel:reel.backgroundColor}));
 return {accent,fond:reel.backgroundColor};
}'''

def capture(page,nom,captures):
    if captures:
        page.evaluate('document.activeElement?.blur()')
        page.evaluate("window.scrollTo({top:0,left:0,behavior:'instant'})")
        page.screenshot(path=str(SORTIE/f'{page.viewport_size["width"]}-{nom}.png'),full_page=True)

def entete(page,captures=False):
    result=page.evaluate('''() => {
 const header=document.querySelector('body>.q-header');const style=e=>getComputedStyle(e);
 const brand=header.querySelector('.q-brand'),mark=header.querySelector('.q-mark'),em=brand.querySelector('em');
 return {total:document.querySelectorAll('body>.q-header').length,bandes:document.querySelectorAll('.q-demo').length,
 slogan:header.querySelector('.q-tagline').textContent,bg:style(header).backgroundColor,
 largeur:header.getBoundingClientRect().width,viewport:innerWidth,
 texte:style(brand).color,logoFond:style(mark).backgroundColor,logoLettre:style(mark).color,
 cjpm:style(em).color,cjpmFond:style(em).backgroundColor,
 cjpmContour:style(em).webkitTextStrokeColor,cjpmContourLargeur:style(em).webkitTextStrokeWidth,
 cjpmPeinture:style(em).paintOrder,cjpmBordure:style(em).borderTopWidth,cjpmOmbre:style(em).boxShadow,
 sloganTotal:document.querySelectorAll('.q-tagline').length,
 sloganDansIdentite:brand.parentElement.contains(header.querySelector('.q-tagline')),
 haut:header.getBoundingClientRect().top,
 ancienBandeau:/QUIZ\\s+CJPM\\s*[·•]\\s*V1/i.test(document.body.innerText),
 liens:[...header.querySelectorAll('.q-nav>button,.q-nav>a,.q-more>summary,.bouton-menu-mobile')].map(e=>({texte:e.textContent.trim().replace(/\\s+/g,' '),couleur:style(e).color})),
 atlasVisible:/\\batlas\\b/i.test(document.body.innerText)};
 }''')
    assert result['total']==1 and result['bandes']==0,result
    assert result['bg']==result['logoLettre']=='rgb(23, 45, 72)',result
    assert result['texte']==result['logoFond']==result['cjpmContour']=='rgb(234, 227, 213)',result
    assert result['cjpmFond']=='rgba(0, 0, 0, 0)',result
    assert result['cjpmBordure']=='0px' and result['cjpmOmbre']=='none',result
    assert result['cjpmContourLargeur']=='1.4px' and result['cjpmPeinture'].startswith('stroke'),result
    assert result['sloganTotal']==1 and result['sloganDansIdentite'],result
    assert abs(result['haut'])<1 and not result['ancienBandeau'],result
    assert result['cjpm']=='rgb(33, 79, 186)',result
    assert result['slogan']=='Comprendre · Pratiquer · Retenir'
    assert result['largeur']==result['viewport']
    assert len(result['liens'])==5,result
    assert all(l['couleur']=='rgb(234, 227, 213)' for l in result['liens'])
    assert not result['atlasVisible']
    verifier_geometrie(page)
    capture(page,'accueil',captures)
    if page.locator('#boutonMenuMobile').count():
        page.locator('#boutonMenuMobile').click();verifier_geometrie(page)
        assert page.locator('#menuPrincipal').is_visible()
        capture(page,'menu-ouvert',captures)
        page.keyboard.press('Escape');assert not page.locator('#menuPrincipal').is_visible()
        page.locator('#boutonParcoursPJJ').click()
        assert page.locator('#boutonParcoursPJJ').evaluate('e=>getComputedStyle(e).color')=='rgb(234, 227, 213)'
    else:
        page.locator('.atlas-static-menu>summary').click();verifier_geometrie(page)
        page.keyboard.press('Escape')
        assert page.locator('.atlas-static-menu').get_attribute('open') is None
    return result

def preferences(page,captures=False):
    assert page.evaluate('creerSauvegardeInitiale().parametres.echelleTexte')==1.15
    assert page.evaluate('sauvegarde.parametres.echelleTexte')==1.15
    for valeur,nom in [(1.15,'Grande'),(.9,'Compacte'),(1,'Normale'),(1.15,'Grande')]:
        page.evaluate("afficherEcran('parametres')")
        page.locator('#boutonTailleTexte'+nom).click()
        assert page.locator('#echelleTexte').input_value()==str(valeur).replace('1.0','1')
        assert page.evaluate('sauvegarde.parametres.echelleTexte')==valeur
        assert abs(page.evaluate('parseFloat(getComputedStyle(document.body).fontSize)')-17*valeur)<.01
        assert page.evaluate("JSON.parse(localStorage.getItem('pjjoue_v1_sauvegarde')).parametres.echelleTexte")==valeur
        verifier_geometrie(page)
    capture(page,'parametres',captures)
    # Paramètre manquant/invalide : Grande ; choix valide existant : conservé.
    r=page.evaluate('''() => {
      const r=[];for(const v of [null,'invalid',0,99,.9,1,1.08,1.15]) {
        const s=creerSauvegardeInitiale();s.parametres.echelleTexte=v;
        r.push([v,nettoyerSauvegarde(s).parametres.echelleTexte]);
      }return r;
    }''')
    assert [e[1] for e in r]==[1.15]*4+[.9,1,1.08,1.15],r
    return {'reglages':4,'restaurations_nettoyees':8,'defaut':1.15}

def preparer_revision(page):
    page.evaluate('''() => {
      sauvegarde=creerSauvegardeInitiale();sauvegarde.aDejaJoue=true;
      for (const t of THEMES) for(const e of PROGRAMMES[t.id].etapes){
       const q=obtenirQuestionsEtape(t.id,e.id)[0];
       sauvegarde.erreurs[q.id]={maitrisee:false,motifRevision:'incorrecte',nombreErreurs:1};
      }
      afficherEcran('erreurs');
    }''')

def revision(page,captures=False):
    preparer_revision(page)
    themes=page.evaluate('THEMES.map(t=>({id:t.id,couleur:obtenirIdentiteParcours(t.id).couleur}))')
    menu='#filtreRevisionParcours-parcours'
    page.locator(menu).click()
    for t in themes:
        page.evaluate(STYLE,dict(sel=f'[data-valeur-filtre="{t["id"]}"]',accent=t['couleur'],part=7))
    capture(page,'revision-parcours',captures)
    total=0
    for t in themes:
        if not page.locator(menu+'-options').is_visible():page.locator(menu).click()
        page.locator(f'{menu}-options [data-valeur-filtre="{t["id"]}"]').click()
        page.evaluate(STYLE,dict(sel=menu,accent=t['couleur'],part=14))
        step='#filtreRevisionEtape-parcours'
        page.locator(step).click()
        etapes=page.evaluate('id=>PROGRAMMES[id].etapes.map(e=>({id:e.id,couleur:obtenirCouleurEtapeAtlas(id,e.id)}))',t['id'])
        for e in etapes:
            page.evaluate(STYLE,dict(sel=f'{step}-options [data-valeur-filtre="{e["id"]}"]',accent=e['couleur'],part=7));total+=1
        if t['id']=='commun':capture(page,'revision-etapes',captures)
        page.locator(f'{step}-options [data-valeur-filtre="{etapes[2]["id"]}"]').click()
        page.evaluate(STYLE,dict(sel=step,accent=etapes[2]['couleur'],part=14))
        # Actual filtering, not only decoration.
        assert page.evaluate('obtenirFiltresRevision("parcours").theme')==t['id']
        assert str(page.evaluate('obtenirFiltresRevision("parcours").etape'))==str(etapes[2]['id'])
        verifier_geometrie(page)
        # Reset step before moving to the next journey (same native action).
        page.locator(step).click();page.locator(step+'-options [data-valeur-filtre="toutes"]').click()
    assert total==66
    return {'parcours':6,'etapes':total}

def entrainement(page,captures=False):
    page.evaluate("afficherEcran('entrainement')")
    menu=page.locator('.atlas-select');options='.entrainement-perimetre-choix'
    menu.locator('summary').click()
    choices=page.evaluate('THEMES.map(t=>({id:t.id,couleur:obtenirIdentiteParcours(t.id).couleur}))')
    for t in choices:page.evaluate(STYLE,dict(sel=f'{options} [data-valeur="{t["id"]}"]',accent=t['couleur'],part=7))
    capture(page,'entrainement-parcours',captures)
    checked=6
    for t in choices:
        if menu.get_attribute('open') is None:menu.locator('summary').click()
        page.locator(f'{options} [data-valeur="{t["id"]}"]').click()
        assert page.locator('#perimetreEntrainement').input_value()==t['id']
        page.evaluate(STYLE,dict(sel='.atlas-select>summary',accent=t['couleur'],part=14))
        assert not menu.get_attribute('open')
    # Steps 6-9 of PJJ were previously uncolored by a fixed "<= 6" predicate.
    for jeu,domaine in [('sigles','cjpm'),('sigles','pjj'),('mesures',None)]:
        page.evaluate('j=>afficherEcran(j)',jeu)
        if domaine:page.evaluate('d=>choisirDomaineSigles(d)',domaine)
        page.locator('#'+jeu+'OuvrirEntrainement').click()
        menu=page.locator('.atlas-select');menu.locator('summary').click()
        current=page.evaluate('''j=>[...document.querySelectorAll('.entrainement-perimetre-choix .choix-bouton')]
         .filter(b=>/^[0-9]+$/.test(b.dataset.valeur)).map(b=>({id:b.dataset.valeur,couleur:(j==='sigles'?obtenirIdentiteEtapeMissionSigles(Number(b.dataset.valeur)):obtenirIdentiteEtapeMissionMesures(Number(b.dataset.valeur))).couleur}))''',jeu)
        for e in current:
            page.evaluate(STYLE,dict(sel=f'{options} [data-valeur="{e["id"]}"]',accent=e['couleur'],part=7));checked+=1
        capture(page,'entrainement-'+(domaine or jeu),captures)
        last=current[-1];page.locator(f'{options} [data-valeur="{last["id"]}"]').click()
        page.evaluate(STYLE,dict(sel='.atlas-select>summary',accent=last['couleur'],part=14))
        verifier_geometrie(page)
    assert checked==36,checked
    return {'choix_colores':checked,'selection_native_et_resume':True}

def questions(page,captures=False):
    results=[]
    for mode in MODES:
        q=page.evaluate(QUESTION,mode)
        accent=page.evaluate('obtenirCouleurEtapeAtlas(etat.questionCourante.theme,etat.questionCourante.etape)')
        if mode=='association':
            a=q['activite']['associations']
            for gauche,droite in a.items():
                page.locator(f'[data-gauche="{gauche}"]').click();page.locator(f'[data-droite="{droite}"]').click()
            page.wait_for_timeout(100)
            first=next(iter(a))
            page.evaluate(STYLE,dict(sel=f'[data-gauche="{first}"]',accent=accent,part=14))
            assert page.locator('.fil-association').count()==len(a)
            # Same actual connected lines inherit every step accent without rebuilding the interaction.
            couleurs=page.evaluate('''() => {
             const r=[];for(const t of THEMES)for(const e of PROGRAMMES[t.id].etapes){
              const q=obtenirQuestionsEtape(t.id,e.id)[0];appliquerIdentiteVisuelleEtape(q);
              const hex=obtenirCouleurEtapeAtlas(t.id,e.id),ref=document.createElement('span');
              ref.style.color=hex;document.body.appendChild(ref);const rgb=getComputedStyle(ref).color;ref.remove();
              const traits=[...document.querySelectorAll('.fil-association')];
              if(!traits.length||traits.some(f=>getComputedStyle(f).stroke!==rgb))throw Error('Fil de mauvaise couleur '+t.id+'/'+e.id);
              r.push(hex);
             }appliquerIdentiteVisuelleEtape(etat.questionCourante);return r;
            }''')
            assert len(couleurs)==66
            # Show a purple stage using a genuine question in that stage when available.
        elif mode=='selection-multiple':
            first=q['activite']['reponses'][0];page.locator(f'[data-proposition="{first}"]').click();page.mouse.move(0,0)
            page.evaluate(STYLE,dict(sel=f'[data-proposition="{first}"]',accent=accent,part=14))
        elif mode=='classer':
            el,cat=next(iter(q['activite']['classements'].items()))
            selector=f'[data-action="attribuer-categorie"][data-element="{el}"][data-categorie="{cat}"]'
            page.locator(selector).click();page.mouse.move(0,0)
            page.evaluate(STYLE,dict(sel=selector,accent=accent,part=14))
        elif mode=='eliminer':
            selector='#zoneReponses .elimination-choix';page.locator(selector).first.click();page.mouse.move(0,0)
            page.evaluate(STYLE,dict(sel=selector+'.elimine',accent=accent,part=14))
        elif mode=='remettre-ordre':
            page.evaluate(STYLE,dict(sel='.ordre-liste>li',accent=accent,part=7))
        elif mode=='reponse-ecrite':
            page.locator('#reponseEcrite').focus()
            page.evaluate(STYLE,dict(sel='#reponseEcrite',accent=accent,part=7))
        else:
            # One-click answers show feedback instantly: green/red must NOT become step colors.
            page.locator('#zoneReponses .reponse[data-est-correcte="1"]').first.click()
            assert page.locator('#zoneCorrection').is_visible()
            assert page.evaluate('etat.questionValidee')
            assert page.locator('#zoneCorrection').evaluate('e=>getComputedStyle(e).borderLeftColor')=='rgb(35, 96, 68)'
        page.mouse.move(0,0);verifier_geometrie(page)
        capture(page,'question-'+mode,captures)
        results.append(mode)
    return {'formats':len(results),'couleurs_fils_etapes':66,'correction_semantique_preservee':True}

def preferences_recharge(navigateur):
    results=[]
    for val in [.9,1,1.15]:
        context=navigateur.new_context(viewport={'width':1440,'height':900})
        page=context.new_page();page.set_content(construire_page_atlas(),wait_until='domcontentloaded')
        data=page.evaluate('v=>{const s=creerSauvegardeInitiale();s.parametres.echelleTexte=v;return JSON.stringify(s)}',val)
        page.close()
        for fichier in ['index.html','guides/index.html','sources.html']:
            # A reload is a NEW document realm; set_content twice on one page
            # would redeclare the real application's global const bindings.
            page=context.new_page()
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.evaluate('d=>window.__atlasStorage={localStorage:[["pjjoue_v1_sauvegarde",d]]}',data)
            page.set_content(construire_page_atlas(fichier),wait_until='domcontentloaded')
            scale=float(page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--echelle-texte')"))
            assert scale==val,(fichier,val,scale)
            assert not errors,errors
            verifier_geometrie(page);results.append((fichier,val))
            page.close()
        context.close()
    return results

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--captures',action='store_true');args=parser.parse_args()
    results=[]
    with sync_playwright() as p:
        executable=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE') or ('/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None)
        browser=p.chromium.launch(**({'executable_path':executable} if executable else {}),args=['--no-sandbox'])
        for width in [1440,1280,1024,768,390,320]:
            cases=[('barre-unique',entete)]
            if width in [1440,390,320]:cases += [('preferences',preferences),('revision',revision),('entrainement',entrainement),('questions',questions)]
            for name,case in cases:
                page=browser.new_page(viewport={'width':width,'height':950},reduced_motion='reduce');page.set_default_timeout(5000)
                errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                try:
                    page.set_content(construire_page_atlas(),wait_until='domcontentloaded')
                    detail=case(page,args.captures);assert not errors,errors
                    results.append({'cas':name,'largeur':width,'statut':'OK','detail':detail});print('OK',width,name,flush=True)
                except Exception as e:
                    results.append({'cas':name,'largeur':width,'statut':'ECHEC','detail':str(e)});print('ECHEC',width,name,str(e),flush=True)
                    page.screenshot(path=str(SORTIE/f'echec-{width}-{name}.png'),full_page=True)
                finally:page.close()
        try:
            detail=preferences_recharge(browser);results.append({'cas':'preferences-restaurees-app-et-guides','statut':'OK','detail':detail});print('OK preferences recharge',flush=True)
        except Exception as e:
            results.append({'cas':'preferences-restaurees-app-et-guides','statut':'ECHEC','detail':str(e)});print('ECHEC preferences recharge',e,flush=True)
        for item in json.loads((RACINE/'code/plan-construction.json').read_text())['pages_autonomes']:
            page=browser.new_page(viewport={'width':1280,'height':950},reduced_motion='reduce')
            try:
                page.set_content(construire_page_atlas(item['sortie']),wait_until='domcontentloaded');entete(page)
                results.append({'cas':'barre-autonome','page':item['sortie'],'statut':'OK'})
            except Exception as e:
                results.append({'cas':'barre-autonome','page':item['sortie'],'statut':'ECHEC','detail':str(e)});print('ECHEC autonome',item['sortie'],e,flush=True)
            page.close()
        browser.close()
    (SORTIE/'rapport.json').write_text(json.dumps({'scenarios':results,'limites':'Chromium en mémoire et stockage de test ; aucune validation PWA réelle.'},ensure_ascii=False,indent=2))
    count=sum(x['statut']=='OK' for x in results);print(f'{count}/{len(results)} scénarios réussis.',flush=True)
    return 0 if count==len(results) else 1
if __name__=='__main__':sys.exit(main())
