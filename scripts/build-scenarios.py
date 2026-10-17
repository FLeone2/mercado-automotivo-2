"""Embed the source-backed Cenários UI; preserve all other authored modules."""
import os as _os, sys as _sys
if __name__ == '__main__' and _os.environ.get('MA_LEGACY_BUILD') != '1':
    _sys.exit('Script legado: ele reembute versões antigas de outros módulos. Use python3 scripts/build.py. '
              'Para forçar mesmo assim: MA_LEGACY_BUILD=1 python3 ' + _sys.argv[0])
from pathlib import Path
import re,subprocess,sys
root=Path(__file__).resolve().parents[1];p=root/'index.html';html=p.read_text()
start='// BEGIN SCENARIOS UI';end='// END SCENARIOS UI'
source=start+'\n'+(root/'src/scenarios.js').read_text()+end
if start in html:
 a=html.index(start);b=html.index(end,a)+len(end);html=html[:a]+source+html[b:]
else:
 html=html.replace('function ReportContent() { return null; }',source+'\nfunction ReportContent() { return null; }')
style='<style id="scenarios-styles">\n'+(root/'src/scenarios.css').read_text()+'\n</style>'
if '<style id="scenarios-styles">' in html:html=re.sub(r'<style id="scenarios-styles">.*?</style>',lambda _:style,html,flags=re.S)
else:html=html.replace('</head>',style+'\n</head>')
html=html.replace("tab==='models'?jsxRuntime.jsx(Phase2View,", "tab==='models'?jsxRuntime.jsx(ScenarioWorkspace,")
p.write_text(html)
subprocess.run([sys.executable,str(root/'scripts/build-evolution.py')],check=True)
subprocess.run([sys.executable,str(root/'scripts/build-navigation.py')],check=True)
