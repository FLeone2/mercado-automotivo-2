"""Embed shared primary map and additive deep state; refresh exact CSP hashes."""
import os as _os, sys as _sys
if __name__ == '__main__' and _os.environ.get('MA_LEGACY_BUILD') != '1':
    _sys.exit('Script legado: ele reembute versões antigas de outros módulos. Use python3 scripts/build.py. '
              'Para forçar mesmo assim: MA_LEGACY_BUILD=1 python3 ' + _sys.argv[0])
from pathlib import Path
import re,subprocess,sys
root=Path(__file__).resolve().parents[1]
p=root/'index.html';html=p.read_text()
start,end='// BEGIN PRIMARY MAP','// END PRIMARY MAP'
block=start+'\n'+'\n'.join((root/'src'/f).read_text() for f in ['primary-map-state.js','primary-map.js'])+'\n'+end+'\n'
if start in html:html=re.sub(re.escape(start)+r'.*?'+re.escape(end)+'\n?',lambda _:block,html,flags=re.S)
else:html=html.replace('function useMarketData(',block+'function useMarketData(',1)
css='<style id="primary-map-styles">\n'+(root/'src/primary-map.css').read_text()+'\n</style>'
if '<style id="primary-map-styles">' in html:html=re.sub(r'<style id="primary-map-styles">.*?</style>',lambda _:css,html,flags=re.S)
else:html=html.replace('</head>',css+'\n</head>',1)
p.write_text(html)
subprocess.run([sys.executable,str(root/'scripts/build-ranking.py')],check=True)
