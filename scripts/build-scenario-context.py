"""Embed Cenários (with the Contexto econômico view first) and the navigation.

Runs build-design-system.py last so the design system stays last and CSP is fresh.
"""
import os as _os, sys as _sys
if __name__ == '__main__' and _os.environ.get('MA_LEGACY_BUILD') != '1':
    _sys.exit('Script legado: ele reembute versões antigas de outros módulos. Use python3 scripts/build.py. '
              'Para forçar mesmo assim: MA_LEGACY_BUILD=1 python3 ' + _sys.argv[0])
from pathlib import Path
import re, subprocess, sys

root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()
# The view lives in src/scenarios.js; re-embed that module and the navigation
# directly (the legacy build-scenarios.py chain re-runs older builders).
html = re.sub(r'// BEGIN SCENARIO CONTEXT.*?// END SCENARIO CONTEXT\n?', '', html, flags=re.S)
start, end = '// BEGIN SCENARIOS UI', '// END SCENARIOS UI'
a = html.index(start); b = html.index(end, a) + len(end)
html = html[:a] + start + '\n' + (root / 'src/scenarios.js').read_text() + end + html[b:]
a = html.index('// BEGIN MARKET NAVIGATION'); b = html.index('// END MARKET NAVIGATION', a)
html = html[:a] + '// BEGIN MARKET NAVIGATION\n' + (root / 'src/navigation.js').read_text() + html[b:]
old = "const scenarioView=SCENARIO_TABS.some(item=>item.value===scenarioSaved.tab)?scenarioSaved.tab:'diagnostic';"
new = "const scenarioView=SCENARIO_TABS.some(item=>item.value===scenarioSaved.tab)?scenarioSaved.tab:'context';"
if new not in html:
    assert html.count(old) == 1
    html = html.replace(old, new)
css = '<style id="scenario-context-styles">\n' + (root / 'src/scenario-context.css').read_text() + '\n</style>'
if '<style id="scenario-context-styles">' in html:
    html = re.sub(r'<style id="scenario-context-styles">.*?</style>', lambda _: css, html, flags=re.S)
else:
    html = html.replace('</head>', css + '\n</head>', 1)
p.write_text(html)
subprocess.run([sys.executable, str(root / 'scripts/build-design-system.py')], check=True)
