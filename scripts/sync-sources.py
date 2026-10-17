"""Safe re-embed of the authored modules edited after the reformulation.

The older build-*.py scripts chain into each other and re-embed stale copies of
other modules, which reverts later work. This script does only this, in order:

  1. re-embed the catalog, Evolution-interactive and Animations blocks and their
     stylesheets from src/ (same markers and ids the legacy builders use);
  2. run the page-notes transform (build-page-notes.py), which adapts notes and
     footers in place and must run after every source embed;
  3. run build-design-system.py (design system stays last, CSP hashes refresh).

Usage: python3 scripts/sync-sources.py
"""
from pathlib import Path
import json, re, subprocess, sys

root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()
src = lambda name: (root / 'src' / name).read_text()


def swap_block(html, start, end, body, anchor=None):
    block = start + '\n' + body + '\n' + end + '\n'
    if start in html:
        return re.sub(re.escape(start) + r'.*?' + re.escape(end) + r'\n?', lambda _: block, html, flags=re.S)
    anchor = anchor or 'function useMarketData('
    assert html.count(anchor) == 1, anchor
    return html.replace(anchor, block + anchor, 1)


def swap_style(html, sid, css):
    tag = '<style id="' + sid + '">\n' + css + '\n</style>'
    if '<style id="' + sid + '">' in html:
        return re.sub(r'<style id="' + re.escape(sid) + r'">.*?</style>', lambda _: tag, html, flags=re.S)
    return html.replace('</head>', tag + '\n</head>', 1)


# 1-. Brand identity colors for the authored scope (the runtime gets them through
#     build-design-system.py). Ranking views and territory maps use them.
html = swap_block(html, '// BEGIN BRAND COLORS', '// END BRAND COLORS', src('brand-colors.js'))
rank_a, rank_b = html.index('// BEGIN RANKING VIEWS'), html.index('// END RANKING VIEWS')
html = html[:rank_a] + '// BEGIN RANKING VIEWS\n' + src('ranking-views.js') + html[rank_b:]
html = re.sub(r'(<style id="ranking-views-styles">).*?(</style>)', lambda m: m[1] + '\n' + src('ranking-views.css') + '\n' + m[2], html, flags=re.S)
html = swap_block(html, '// BEGIN TERRITORY BRAND MAPS', '// END TERRITORY BRAND MAPS', src('territory-brand-maps.js'))
html = swap_style(html, 'territory-brand-maps-styles', src('territory-brand-maps.css'))

html = swap_block(html, '// BEGIN CHART SCALES', '// END CHART SCALES', src('chart-scales.js'))

# 1a. Additive catalog (Mais análises / Todos os formatos).
html = swap_block(html, '// BEGIN ADDITIVE CATALOG', '// END ADDITIVE CATALOG',
                  '\n'.join(src(n) for n in ['catalog-charts.js', 'catalog-maps.js', 'catalog-workspace.js']))
for sid in ['catalog-charts', 'catalog-maps', 'catalog-workspace']:
    if (root / 'src' / (sid + '.css')).exists():
        html = swap_style(html, sid + '-styles', src(sid + '.css'))

# 1b. Evolution interactive panels (Explorar período / Comparar anos).
html = swap_block(html, '// BEGIN EVOLUTION INTERACTIVE', '// END EVOLUTION INTERACTIVE',
                  '\n'.join(src(n) for n in ['evolution-brush.js', 'evolution-years.js']))
for sid in ['evolution-brush', 'evolution-years']:
    html = swap_style(html, sid + '-styles', src(sid + '.css'))

# 1c. Animations workspace; its worker travels as an escaped string constant.
worker = src('performance-cache.js') + '\n' + src('animations-data.js') + '\n' + src('animations-worker.js')
body = 'const ANIMATIONS_WORKER_SOURCE=' + json.dumps(worker, ensure_ascii=True) + ';\n' + '\n'.join(
    src(n) for n in ['animations-data.js', 'animations-charts.js', 'animations-maps.js', 'animations.js'])
html = swap_block(html, '// BEGIN ANIMATIONS WORKSPACE', '// END ANIMATIONS WORKSPACE', body)
for sid in ['animations', 'animations-charts', 'animations-maps']:
    html = swap_style(html, sid + '-styles', src(sid + '.css'))

# 1d. Evolution market worker (daily/annual series for Explorar período).
worker_src = src('performance-cache.js') + '\n' + src('evolution-market-worker.js')
found = 0


def swap_worker(m):
    global found
    if 'installMarketWorker' not in json.loads(m[1]):
        return m[0]
    found += 1
    return 'new Blob([' + json.dumps(worker_src, ensure_ascii=False)


html = re.sub(r'new Blob\(\[("(?:[^"\\]|\\.)*")', swap_worker, html)
assert found == 1, 'market worker blob not found exactly once'
p.write_text(html)

# 2 and 3.
subprocess.run([sys.executable, str(root / 'scripts/build-page-notes.py')], check=True)
subprocess.run([sys.executable, str(root / 'scripts/build-design-system.py')], check=True)
