"""Embed "Mitsubishi no seu segmento" at the top of Concorrência › Marcas e modelos.
Runs build-design-system.py last (design system stays last, CSP refreshed)."""
import os as _os, sys as _sys
if __name__ == '__main__' and _os.environ.get('MA_LEGACY_BUILD') != '1':
    _sys.exit('Script legado: ele reembute versões antigas de outros módulos. Use python3 scripts/build.py. '
              'Para forçar mesmo assim: MA_LEGACY_BUILD=1 python3 ' + _sys.argv[0])
from pathlib import Path
import re, subprocess, sys

root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()
start, end = '// BEGIN COMPETITIVE READING', '// END COMPETITIVE READING'
block = start + '\n' + (root / 'src/competitive-reading.js').read_text() + '\n' + end + '\n'
if start in html:
    html = re.sub(re.escape(start) + r'.*?' + re.escape(end) + '\n?', lambda _: block, html, flags=re.S)
else:
    assert html.count('function useMarketData(') == 1
    html = html.replace('function useMarketData(', block + 'function useMarketData(', 1)
anchor = "tab==='competition'&&jsxRuntime.jsxs('div', { className:'am-competition-view', children: ["
mount = anchor + "jsxRuntime.jsx(CompetitiveReading,{filters:effectiveFilters,manifest,base:getBase(snapshot)}), "
if 'jsxRuntime.jsx(CompetitiveReading,' not in html:
    assert html.count(anchor) == 1
    html = html.replace(anchor, mount, 1)
css = '<style id="competitive-reading-styles">\n' + (root / 'src/competitive-reading.css').read_text() + '\n</style>'
if '<style id="competitive-reading-styles">' in html:
    html = re.sub(r'<style id="competitive-reading-styles">.*?</style>', lambda _: css, html, flags=re.S)
else:
    html = html.replace('</head>', css + '\n</head>', 1)
p.write_text(html)
subprocess.run([sys.executable, str(root / 'scripts/build-design-system.py')], check=True)
