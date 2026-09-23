"""Analytics : parcours et étapes doivent être lisibles et non ambigus."""
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from atlas_support import construire_page_atlas


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce')
        try:
            page.set_content(construire_page_atlas(), wait_until='domcontentloaded')
            resultat = page.evaluate("""() => {
                window.PJJConsentement = { estAutorise: () => true };
                window.dataLayer = [];
                const theme = 'procedure_ordinaire';
                etat.theme = theme;
                etat.mode = 'parcours';
                etat.etape = 1;
                etat.ecran = 'question';
                const question = obtenirQuestionsEtape(theme, 1)[0];
                etat.questionsSession = [question];
                etat.indexQuestion = 0;

                const parcours = obtenirInformationsParcoursAnalytics(question);
                const etape = obtenirInformationsEtapeAnalytics(question);
                const contexte = obtenirContexteQuestionAnalytics(question);
                envoyerEvenementPJJ('question_affichee', contexte);
                const evenement = window.dataLayer.at(-1);

                etat.mode = 'evaluation-finale';
                etat.etape = 12;
                const evaluation = obtenirContexteSessionAnalytics();

                return {
                    titreParcours: PROGRAMMES[theme].titre,
                    parcours,
                    etape,
                    contexte,
                    evenement,
                    evaluation
                };
            }""")

            attendu_titre = resultat['titreParcours']
            contexte = resultat['contexte']
            evenement = resultat['evenement']

            assert resultat['parcours'] == {
                'identifiant': 'procedure_ordinaire',
                'numero': 1,
                'nom': attendu_titre,
            }, resultat['parcours']

            assert contexte['pjjoue_nom_parcours'] == attendu_titre
            assert contexte['pjjoue_parcours'] == attendu_titre
            assert contexte['pjjoue_identifiant_parcours'] == 'procedure_ordinaire'
            assert contexte['pjjoue_numero_parcours'] == 1

            assert contexte['pjjoue_numero_etape_visible'] == 1
            assert contexte['pjjoue_nom_etape']
            assert contexte['pjjoue_identifiant_etape'] == contexte['pjjoue_numero_etape']
            assert contexte['pjjoue_identifiant_etape'] is not None

            assert evenement['event'] == 'pjjoue_question_affichee'
            for cle in (
                'pjjoue_nom_parcours',
                'pjjoue_identifiant_parcours',
                'pjjoue_numero_parcours',
                'pjjoue_nom_etape',
                'pjjoue_numero_etape_visible',
                'pjjoue_identifiant_etape',
            ):
                assert evenement.get(cle) == contexte.get(cle), (cle, evenement, contexte)

            evaluation = resultat['evaluation']
            assert evaluation['pjjoue_numero_parcours'] == 1
            assert evaluation['pjjoue_numero_etape'] == 12
            assert evaluation['pjjoue_numero_etape_visible'] == 12
            assert evaluation['pjjoue_identifiant_etape'] == 12
            assert evaluation['pjjoue_nom_etape'] == 'Évaluation finale'

            print('OK — Analytics : parcours + étape visible + identifiants stables envoyés')
        finally:
            page.close()
            browser.close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
