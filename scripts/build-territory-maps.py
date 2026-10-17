"""Embed the territory brand maps (top 3 per state, municipal spikes, states in 3D).

Inserts src/territory-brand-maps.js before useMarketData, mounts it right after
the primary map on the Territórios tab, embeds its stylesheet, then runs
build-design-system.py so the design system stays last and CSP hashes are fresh.
"""
from pathlib import Path
import re, subprocess, sys

root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()
start, end = '// BEGIN TERRITORY BRAND MAPS', '// END TERRITORY BRAND MAPS'
block = start + '\n' + (root / 'src/territory-brand-maps.js').read_text() + '\n' + end + '\n'
if start in html:
    html = re.sub(re.escape(start) + r'.*?' + re.escape(end) + '\n?', lambda _: block, html, flags=re.S)
else:
    assert html.count('function useMarketData(') == 1
    html = html.replace('function useMarketData(', block + 'function useMarketData(', 1)

anchor = "pending:overviewMapQuery.pending,error:overviewMapQuery.error})})"
mount = anchor + "\n   , tab==='geography'&&mapReady&&jsxRuntime.jsx(TerritoryBrandMaps,{filters:effectiveFilters,manifest,base:getBase(snapshot)})"
if 'jsxRuntime.jsx(TerritoryBrandMaps,' not in html:
    assert html.count(anchor) == 1
    html = html.replace(anchor, mount, 1)

css = '<style id="territory-brand-maps-styles">\n' + (root / 'src/territory-brand-maps.css').read_text() + '\n</style>'
if '<style id="territory-brand-maps-styles">' in html:
    html = re.sub(r'<style id="territory-brand-maps-styles">.*?</style>', lambda _: css, html, flags=re.S)
else:
    html = html.replace('</head>', css + '\n</head>', 1)
p.write_text(html)
subprocess.run([sys.executable, str(root / 'scripts/build-design-system.py')], check=True)
