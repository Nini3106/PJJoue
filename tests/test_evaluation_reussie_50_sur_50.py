"""Régression : une évaluation réussie doit toujours afficher 50/50."""
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
                sauvegarde = creerSauvegardeInitiale();
                const theme = THEMES[0].id;
                const programme = PROGRAMMES[theme];

                for (const etape of programme.etapes) {
                    const bilan = obtenirBilanEtape(theme, etape.id);
                    bilan.termineeSansJoker = true;
                    bilan.nombreTentatives = 1;
                    for (const q of obtenirQuestionsEtape(theme, etape.id)) {
                        bilan.questionsTraitees[q.id] = true;
                        bilan.resultats[q.id] = true;
                        bilan.validationsSansJoker[q.id] = true;
                    }
                }

                const evaluation = obtenirEvaluationFinaleTheme(theme);
                evaluation.reussie = true;
                evaluation.meilleurScore = 96;
                evaluation.nombreTentatives = 1;

                const questions = QUESTIONS.filter(q => q.theme === theme && q.estEvaluationFinale === true);
                ecrireInstantaneSessionEnCours({
                    version: 2,
                    questions: questions.map(q => q.id),
                    mode: 'evaluation-finale',
                    theme,
                    reponsesSession: [],
                    questionsPassees: []
                });

                etat.mode = 'parcours';
                ouvrirParcours(theme);

                const carte = document.querySelector('#carteEvaluationFinale');
                return {
                    progression: carte.querySelector('.evaluation-progression')?.textContent.trim(),
                    etat: carte.querySelector('.evaluation-etat')?.textContent.trim(),
                    etoile: Boolean(carte.querySelector('.etoile-filante-evaluation'))
                };
            }""")

            assert resultat == {
                'progression': '50/50 questions d’évaluation',
                'etat': 'Parcours maîtrisé',
                'etoile': True,
            }, resultat
            print('OK — évaluation réussie : 50/50 malgré un ancien instantané à zéro')
        finally:
            page.close()
            browser.close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
