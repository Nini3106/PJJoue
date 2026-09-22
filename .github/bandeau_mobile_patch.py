from pathlib import Path

p = Path("code/01 - Éléments communs/atlas-systeme.css")
s = p.read_text(encoding="utf-8")

old = """ #qc-atlas .q-header {
   min-height:68px;
   padding:12px 16px;
   align-items:center;
   gap:12px;
 }
 #qc-atlas .q-identity { gap:10px; }
"""

new = """ #qc-atlas .q-header {
   min-height:54px;
   padding:5px 10px;
   align-items:center;
   gap:8px;
 }
 #qc-atlas .q-identity {
   gap:8px;
   flex:1 1 auto;
   min-width:0;
 }
 #qc-atlas .q-header .q-brand {
   font-size:calc(18px * var(--echelle-texte,1));
   gap:8px;
 }
 #qc-atlas .q-mark {
   width:32px;
   height:32px;
   font-size:calc(22px * var(--echelle-texte,1));
 }
 #qc-atlas .q-tagline {
   display:block;
   max-width:92px;
   white-space:normal;
   font-size:calc(9px * var(--echelle-texte,1));
   line-height:1.2;
 }
"""

assert s.count(old) == 1
s = s.replace(old, new, 1)

old = """ #qc-atlas .bouton-menu-mobile,
 #qc-atlas .atlas-static-menu > summary {
   min-width:92px;
   border:1px solid color-mix(in srgb,var(--q-paper) 38%,transparent);
   background:color-mix(in srgb,var(--q-paper) 9%,var(--q-menu-fond));
   border-radius:8px;
   padding:9px 12px;
 }
"""

new = """ #qc-atlas .bouton-menu-mobile,
 #qc-atlas .atlas-static-menu > summary {
   min-width:82px;
   min-height:44px;
   border:1px solid color-mix(in srgb,var(--q-paper) 38%,transparent);
   background:color-mix(in srgb,var(--q-paper) 9%,var(--q-menu-fond));
   border-radius:8px;
   padding:6px 10px;
 }
"""

assert s.count(old) == 1
s = s.replace(old, new, 1)

p.write_text(s, encoding="utf-8")
print("Bandeau mobile compact appliqué.")
