"""Rendu Chromium hors réseau des vrais fichiers construits, réservé aux tests.
Les scripts métier ne sont pas réécrits ; seule l'écriture d'URL est neutralisée
sur about:blank. Storage est simulé, car cette origine opaque le refuse.
La navigation HTTP/file et l'installation restent à vérifier sur un vrai hôte.
"""
from pathlib import Path
import base64, html, mimetypes, re
RACINE = Path(__file__).resolve().parents[1]

def construire_page_atlas(relative='index.html', racine=RACINE):
    page = racine / relative
    source = page.read_text(encoding='utf-8')
    source = re.sub(r'<meta\b(?=[^>]*http-equiv=["\']Content-Security-Policy["\'])[^>]*>', '', source, flags=re.I)
    source = re.sub(r'<base\b[^>]*>', '', source, flags=re.I)
    def attr(tag, name):
        m = re.search(r'\b'+name+r'=["\']([^"\']+)["\']', tag, re.I)
        return html.unescape(m[1]) if m else ''
    def fichier(chemin):
        return (page.parent / chemin.split('?')[0].split('#')[0]).resolve()
    def styles(m):
        tag = m[0]
        if attr(tag,'rel') != 'stylesheet': return ''
        path = fichier(attr(tag,'href'))
        return '<style>'+path.read_text(encoding='utf-8')+'</style>'
    source = re.sub(r'<link\b[^>]*>',styles,source,flags=re.I)
    scripts_differes=[]
    def script(m):
        tag=m[0]; path=fichier(attr(tag,'src'))
        if path.name in ['consentement-analytics.js','analytics-pjjoue.js','analytics-pages-pjjoue.js']:
            return ''
        js=path.read_text(encoding='utf-8')
        if path.name=='moteur-jeu.js':
            js=js.replace('restaurerRoute(history.state || lireRoute());',
                'mettreAJourAdresseNavigation = () => {}; restaurerRoute(history.state || lireRoute());',1)
        scripts_differes.append('<script>'+js+'</script>')
        return ''
    source=re.sub(r'<script\b(?=[^>]*\bsrc=)[^>]*>\s*</script>',script,source,flags=re.I)
    def image(m):
        tag=m[0];path=fichier(attr(tag,'src'))
        if path.is_file():
            data='data:'+str(mimetypes.guess_type(str(path))[0])+';base64,'+base64.b64encode(path.read_bytes()).decode()
            tag=re.sub(r'\bsrc=["\'][^"\']+["\']',lambda _:'src="'+data+'"',tag)
            tag=re.sub(r'\bsrcset=["\'][^"\']+["\']','',tag)
        return tag
    source=re.sub(r'<img\b[^>]*>',image,source,flags=re.I)
    # Dépendances et origine de test seulement ; aucune de ces lignes n'est publiée.
    parent=Path(relative).parent.as_posix().strip('.')
    bootstrap='''<base href="https://pjjoue.test/'''+parent.strip('/')+'''/"><script>
    for (const name of ['localStorage','sessionStorage']) {
      const values = new Map(window.__atlasStorage?.[name] || []);
      Object.defineProperty(window,name,{configurable:true,value:{
        getItem:k=>values.has(String(k))?values.get(String(k)):null,
        setItem:(k,v)=>values.set(String(k),String(v)),removeItem:k=>values.delete(String(k)),
        clear:()=>values.clear(),key:i=>[...values.keys()][i]??null,get length(){return values.size;}
      }});
    }
    let graineTest=123456789;
    Math.random=()=>{graineTest=(1103515245*graineTest+12345)%2147483648;return graineTest/2147483648};
    </script>'''
    # Les scripts externes du produit sont différés : leur version inline doit
    # aussi s'exécuter APRES tout le DOM, y compris les dialogues placés en fin.
    source=source.replace('</body>',''.join(scripts_differes)+'</body>',1)
    return source.replace('<head>','<head>'+bootstrap,1)
