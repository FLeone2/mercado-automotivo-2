"""Embed "O que mudou" on Panorama and make Territórios the only home of the primary map.

The Panorama copy of the map (and its extra national query) is removed; the KPI
cards move to the top. Runs build-design-system.py last for CSP hashes.
"""
from pathlib import Path
import re, subprocess, sys

root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()
start, end = '// BEGIN OVERVIEW INSIGHTS', '// END OVERVIEW INSIGHTS'
block = start + '\n' + (root / 'src/overview-insights.js').read_text() + '\n' + end + '\n'
if start in html:
    html = re.sub(re.escape(start) + r'.*?' + re.escape(end) + '\n?', lambda _: block, html, flags=re.S)
else:
    assert html.count('function useMarketData(') == 1
    html = html.replace('function useMarketData(', block + 'function useMarketData(', 1)

edits = [
    # Insights first on Panorama.
    ("tab==='dashboard'&&jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [\n     jsxRuntime.jsxs('div',{className:'am-overview-summary',",
     "tab==='dashboard'&&jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [\n     jsxRuntime.jsx(OverviewInsights,{model,period:titlePeriod}),\n     jsxRuntime.jsxs('div',{className:'am-overview-summary',"),
    # The primary map lives on Territórios only.
    ("useMarketData(overviewMapFilters,['dashboard','geography'].includes(tab)&&mapReady,'primary-map',false)",
     "useMarketData(overviewMapFilters,tab==='geography'&&mapReady,'primary-map',false)"),
    ("['dashboard','geography'].includes(tab)&&mapReady&&jsxRuntime.jsx(PendingChartSnapshot,{pending:overviewMapQuery.pending",
     "tab==='geography'&&mapReady&&jsxRuntime.jsx(PendingChartSnapshot,{pending:overviewMapQuery.pending"),
]
for old, new in edits:
    if new not in html:
        assert html.count(old) == 1, old[:70]
        html = html.replace(old, new)

css = '<style id="overview-insights-styles">\n' + (root / 'src/overview-insights.css').read_text() + '\n</style>'
if '<style id="overview-insights-styles">' in html:
    html = re.sub(r'<style id="overview-insights-styles">.*?</style>', lambda _: css, html, flags=re.S)
else:
    html = html.replace('</head>', css + '\n</head>', 1)
p.write_text(html)
subprocess.run([sys.executable, str(root / 'scripts/build-design-system.py')], check=True)
