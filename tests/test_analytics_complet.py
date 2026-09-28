"""Intégration du vrai collecteur avec les trois jeux et les supports."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from atlas_support import construire_page_atlas
R=Path(__file__).resolve().parents[1]
def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(args=['--no-sandbox'])
        page=browser.new_page()
        erreurs=[]
        page.on('pageerror',lambda e: erreurs.append(str(e)))
        page.set_content(construire_page_atlas(),wait_until='domcontentloaded')
        page.evaluate("window.PJJConsentement={estAutorise:()=>true};window.dataLayer=[]")
        page.add_script_tag(content=(R/'ressources/analytics-pjjoue.js').read_text())
        for lancer,identifiant in [("lancerEtape('procedure_ordinaire',1)",'procedure_ordinaire'),('lancerEtapeSigles(1)','mission_sigles'),('lancerEtapeMesures(1)','mission_mesures')]:
            resultat=page.evaluate('''lancer=>{
                window.dataLayer=[];
                eval(lancer);
                etat.debutSessionAnalytics=Date.now()-42000;
                terminerSession();
                terminerSession();
                const fins=dataLayer.filter(e=>e.event==='pjjoue_session_terminee');
                const debut=dataLayer.find(e=>e.event==='pjjoue_session_commencee');
                afficherEcran('supports',{forcerSortieQuestion:true});
                const modele=Object.assign({},...dataLayer);
                return {fins:JSON.parse(JSON.stringify(fins)),debut:JSON.parse(JSON.stringify(debut)),scoreApresPage:modele.pjjoue_score??null,parcoursApresPage:modele.pjjoue_identifiant_parcours??null};
            }''',lancer)
            assert len(resultat['fins'])==1,resultat
            fin=resultat['fins'][0]
            assert fin['pjjoue_identifiant_parcours']==identifiant,fin
            assert fin['pjjoue_duree_session_secondes']>=42,fin
            assert fin['pjjoue_joker_utilise_session']=='Non',fin
            assert fin['pjjoue_resultat_session']=='Session terminée',fin
            assert 'pjjoue_resultat_reponse' not in fin,fin
            assert resultat['scoreApresPage'] is None,resultat
            assert resultat['parcoursApresPage'] is None,resultat
            assert resultat['debut']['pjjoue_identifiant_parcours']==identifiant,resultat
        precision=page.evaluate("""()=>{
            choisirDomaineSigles('pjj');lancerEtapeSigles(6);
            const sigle=JSON.parse(JSON.stringify(dataLayer.filter(e=>e.event==='pjjoue_question_affichee').at(-1)));
            etat.ecran='parcours';etat.theme='procedure_ordinaire';
            return {sigle,parcours:obtenirContexteAnalyticsGlobal(),etapeCjpm:obtenirInformationsEtapeAnalytics({theme:'procedure_ordinaire',etape:1})};
        }""")
        assert precision['etapeCjpm']['numero']==21,precision
        assert precision['sigle']['pjjoue_numero_etape']==6,precision
        assert precision['sigle']['pjjoue_numero_etape_visible']==1,precision
        assert precision['sigle']['pjjoue_reperes_question'],precision
        assert precision['parcours']['pjjoue_identifiant_parcours']=='procedure_ordinaire',precision
        contexte=page.evaluate('''()=>{
            etat.mode='libre';etat.origineSessionAnalytics='entrainement_libre';etat.theme='toutes';
            return obtenirContexteQuestionAnalytics(QUESTIONS.find(q=>q.theme==='information_judiciaire'&&!q.estEvaluationFinale));
        }''')
        assert contexte['pjjoue_identifiant_parcours']=='information_judiciaire',contexte
        assert contexte['pjjoue_perimetre_session']=='Tous les parcours',contexte
        page.evaluate("afficherEcran('supports',{forcerSortieQuestion:true});dataLayer=[]")
        # Ouverture manuelle : une mesure ; ouverture automatique par recherche : aucune.
        page.locator('#supports .supports-juridiction > summary').first.click()
        assert page.evaluate("dataLayer.filter(e=>e.event==='pjjoue_support_ouvert').length")==1
        page.locator('#rechercheSupports').fill('secret-personnel@example.invalid')
        page.wait_for_timeout(750)
        assert page.evaluate("dataLayer.filter(e=>e.event==='pjjoue_support_ouvert').length")==1
        recherche=page.evaluate("JSON.parse(JSON.stringify(dataLayer.find(e=>e.event==='pjjoue_supports_recherches')))")
        assert recherche['pjjoue_nombre_resultats']==0,recherche
        assert 'secret-personnel' not in str(recherche),recherche
        page.evaluate("ouvrirEntrainementMissionSiglesNatif();dataLayer=[];envoyerOptionDeJeuAnalytics('Mélangé')")
        assert page.evaluate("dataLayer.at(-1).pjjoue_identifiant_parcours")=='mission_sigles'
        assert not erreurs,erreurs
        for chemin,libelle in [('confidentialite.html','Confidentialité'),('sources.html','Sources officielles'),('guides/index.html','Guides')]:
            publique=browser.new_page()
            publique.route('https://pjjoue.test/**', lambda route: route.fulfill(body=construire_page_atlas(chemin),content_type='text/html'))
            publique.goto('https://pjjoue.test/'+chemin)
            publique.evaluate("window.PJJConsentement={estAutorise:()=>true};window.dataLayer=[]")
            publique.add_script_tag(content=(R/'ressources/analytics-pjjoue.js').read_text())
            publique.add_script_tag(content=(R/'ressources/analytics-pages-pjjoue.js').read_text())
            publique.evaluate("window.dispatchEvent(new CustomEvent('pjjoue:consentement-change',{detail:{analytics:true}}))")
            events=publique.evaluate("JSON.parse(JSON.stringify(dataLayer))")
            assert len(events)==1,(chemin,events)
            assert events[0]['pjjoue_page_consultee']==libelle,(chemin,events)
            assert ('pjjoue_nom_guide' in events[0])==(libelle=='Guides'),events
            publique.close()
        browser.close()
    print('OK — vrai collecteur : trois jeux, fins uniques, durée, contexte, supports et confidentialité')
if __name__=='__main__':main()
