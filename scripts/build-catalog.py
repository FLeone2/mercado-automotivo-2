"""Embed additive catalog sources and reuse audited worker/CSP rebuild."""
import os as _os, sys as _sys
if __name__ == '__main__' and _os.environ.get('MA_LEGACY_BUILD') != '1':
    _sys.exit('Script legado: ele reembute versões antigas de outros módulos. Use python3 scripts/build.py. '
              'Para forçar mesmo assim: MA_LEGACY_BUILD=1 python3 ' + _sys.argv[0])
from pathlib import Path
import re,subprocess,sys
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(root/'scripts/build_catalog_population.py')],check=True)
p=root/'index.html';html=p.read_text()
# Optional query flag: use a separate mounted hook, preserving all legacy requests.
a=html.index('function useMarketData(');b=html.index('function Empty(',a)
hook=html[a:b]
if 'includeCatalog=' not in hook:
 hook=hook.replace("const signature=canonicalFilterKey(filters),", "const signature=canonicalFilterKey(filters),includeCatalog=mode==='catalog',")
 hook=hook.replace('includeMitsubishiProfile}', 'includeMitsubishiProfile,includeCatalog}').replace('includeMitsubishiProfile]', 'includeMitsubishiProfile,includeCatalog]')
html=html[:a]+hook+html[b:]
start,end='// BEGIN ADDITIVE CATALOG','// END ADDITIVE CATALOG'
block=start+'\n'+'\n'.join((root/'src'/f).read_text() for f in ['catalog-charts.js','catalog-maps.js','catalog-workspace.js'])+'\n'+end+'\n'
if start in html:html=re.sub(re.escape(start)+r'.*?'+re.escape(end)+'\n?',lambda _:block,html,flags=re.S)
else:html=html.replace('function useMarketData(',block+'function useMarketData(',1)
mount=", tab!=='quality'&&jsxRuntime.jsx(CatalogExtras,{key:tab,tab,filters:effectiveFilters,scope,dataBase:getBase(snapshot),setFilter})\n  "
if 'jsxRuntime.jsx(CatalogExtras,' not in html:html=html.replace(", tab!=='ranking'&&jsxRuntime.jsxs('footer'",mount+", tab!=='ranking'&&jsxRuntime.jsxs('footer'",1)
for name in ['catalog-charts','catalog-maps','catalog-workspace','catalog-themes']:
 file=root/'src'/(name+'.css')
 if not file.exists():continue
 css='<style id="'+name+'-styles">\n'+file.read_text()+'\n</style>'
 if '<style id="'+name+'-styles">' in html:html=re.sub(r'<style id="'+name+r'-styles">.*?</style>',lambda _:css,html,flags=re.S)
 else:html=html.replace('</head>',css+'\n</head>',1)
theme=root/'src/catalog-themes.js'
if theme.exists():
 start,end='/* BEGIN CATALOG THEMES */','/* END CATALOG THEMES */'
 block=start+'\n'+theme.read_text()+'\ninstallCatalogThemes(T5,C5);\n'+end
 if start in html:html=re.sub(re.escape(start)+r'.*?'+re.escape(end),lambda _:block,html,flags=re.S)
 else:html=html.replace('/* END MARKET BLUE THEME */','/* END MARKET BLUE THEME */'+block,1)
p.write_text(html)
subprocess.run([sys.executable,str(root/'scripts/build-evolution.py')],check=True)
