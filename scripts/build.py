"""The single build: embed every authored module from src/ into index.html.

index.html is the published page. Each authored module lives in src/ and is
embedded between `// BEGIN <NAME>` and `// END <NAME>` markers (scripts) or in a
`<style id="...">` block (styles). This script, in order:

  1. re-embeds every module and stylesheet from src/ (MODULES and STYLES below);
  2. re-applies the small idempotent mount patches that place modules on their tabs;
  3. runs the page-notes transform (build-page-notes.py), which must follow any embed;
  4. runs build-design-system.py last (design system styles, runtime patches, CSP hashes).

Usage:  python3 scripts/build.py           then   bash scripts/test.sh

The older build-*.py scripts chain into each other and re-embed stale copies of
other modules; they refuse to run unless MA_LEGACY_BUILD=1 (see README).
"""
from pathlib import Path
import json, re, subprocess, sys

root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()
src = lambda name: (root / 'src' / name).read_text()

# (marker, source files). Order inside index.html is fixed by where each block already
# lives; a block missing from index.html is inserted before useMarketData.
MODULES = [
    ('BRAND COLORS', ['brand-colors.js']),
    ('CHART SCALES', ['chart-scales.js']),
    ('RANKING VIEWS', ['ranking-views.js']),
    ('TERRITORY CHANNELS', ['territory-channels.js']),
    ('EVOLUTION VIEWS', ['evolution-views.js']),
    ('PAGE NOTES', ['page-notes.js']),
    ('MARKET NAVIGATION', ['navigation.js']),
    ('ADDITIVE CATALOG', ['catalog-charts.js', 'catalog-maps.js', 'catalog-workspace.js']),
    ('PRIMARY MAP', ['primary-map-state.js', 'primary-map.js']),
    ('EVOLUTION INTERACTIVE', ['evolution-brush.js', 'evolution-years.js']),
    ('SHARED QUERY SERVICE', ['query-service.js']),
    ('PERFORMANCE UI', ['performance-ui.js']),
    ('TERRITORY BRAND MAPS', ['territory-brand-maps.js']),
    ('OVERVIEW INSIGHTS', ['overview-insights.js']),
    ('COMPETITIVE READING', ['competitive-reading.js']),
    ('SCENARIOS UI', ['scenarios.js']),
    ('HISTORY DATA', ['history-data.js']),
    ('MARKET PULSE', ['market-pulse.js']),
    ('EXPORT TOOLS', ['export-tools.js']),
]
# style id -> source stylesheet ('overview-clean-styles' has no source and is left as is).
STYLES = {
    'ranking-views-styles': 'ranking-views.css', 'evolution-views-styles': 'evolution-views.css',
    'market-navigation-styles': 'navigation.css', 'scenarios-styles': 'scenarios.css',
    'territory-channel-styles': 'territory-channels.css', 'catalog-charts-styles': 'catalog-charts.css',
    'catalog-maps-styles': 'catalog-maps.css', 'catalog-workspace-styles': 'catalog-workspace.css',
    'primary-map-styles': 'primary-map.css', 'evolution-brush-styles': 'evolution-brush.css',
    'evolution-years-styles': 'evolution-years.css', 'animations-styles': 'animations.css',
    'animations-charts-styles': 'animations-charts.css', 'animations-maps-styles': 'animations-maps.css',
    'page-notes-styles': 'page-notes.css', 'competition-fixes-styles': 'competition-fixes.css',
    'overview-refinements-styles': 'overview-refinements.css',
    'shared-layout-refinements-styles': 'shared-layout-refinements.css',
    'territory-brand-maps-styles': 'territory-brand-maps.css', 'overview-insights-styles': 'overview-insights.css',
    'scenario-context-styles': 'scenario-context.css', 'competitive-reading-styles': 'competitive-reading.css',
    'market-pulse-styles': 'market-pulse.css',
    'export-tools-styles': 'export-tools.css',
}
# New modules added after the reformulation register here too (see EXTRA_MODULES below).
EXTRA_MODULES = []   # (marker, [files], style id or None, css file or None)
EXTRA_PATH = root / 'scripts' / 'build-modules.json'
if EXTRA_PATH.exists():
    EXTRA_MODULES = [tuple(m) for m in json.loads(EXTRA_PATH.read_text())]


def swap_block(html, name, body):
    start, end = '// BEGIN ' + name, '// END ' + name
    if start in html:
        a = html.index(start) + len(start)
        b = html.index(end, a)
        return html[:a] + '\n' + body.rstrip('\n') + '\n' + html[b:]
    anchor = 'function useMarketData('
    assert html.count(anchor) == 1, anchor
    return html.replace(anchor, start + '\n' + body.rstrip('\n') + '\n' + end + '\n' + anchor, 1)


def swap_style(html, sid, css):
    tag = '<style id="' + sid + '">\n' + css.strip('\n') + '\n</style>'
    if '<style id="' + sid + '">' in html:
        return re.sub(r'<style id="' + re.escape(sid) + r'">.*?</style>', lambda _: tag, html, flags=re.S)
    return html.replace('</head>', tag + '\n</head>', 1)


def patch(html, old, new):
    if new in html:
        return html
    # A later mount may have edited around this one: it is applied when the text it
    # inserts (the part between the common prefix and suffix) is already present.
    p = 0
    while p < min(len(old), len(new)) and old[p] == new[p]:
        p += 1
    q = 0
    while q < min(len(old), len(new)) - p and old[-1 - q] == new[-1 - q]:
        q += 1
    inserted = new[p:len(new) - q]
    if old not in html and len(inserted.strip()) > 20 and inserted in html:
        return html
    assert html.count(old) == 1, 'mount anchor not found: ' + old[:80]
    return html.replace(old, new, 1)


# 1. Modules and stylesheets.
for name, files in MODULES:
    html = swap_block(html, name, '\n'.join(src(f) for f in files))
for name, files, sid, css in EXTRA_MODULES:
    html = swap_block(html, name, '\n'.join(src(f) for f in files))
    if sid:
        html = swap_style(html, sid, src(css))
for sid, css in STYLES.items():
    html = swap_style(html, sid, src(css))

# Animations: the worker travels as an escaped string constant.
worker = src('performance-cache.js') + '\n' + src('animations-data.js') + '\n' + src('animations-worker.js')
html = swap_block(html, 'ANIMATIONS WORKSPACE', 'const ANIMATIONS_WORKER_SOURCE=' + json.dumps(worker, ensure_ascii=True) + ';\n' + '\n'.join(
    src(n) for n in ['animations-data.js', 'animations-charts.js', 'animations-maps.js', 'animations.js']))

# Evolution market worker (shared by most tabs): replace the one blob that installs it.
market = src('performance-cache.js') + '\n' + src('evolution-market-worker.js')
found = 0


def swap_worker(m):
    global found
    if 'installMarketWorker' not in json.loads(m[1]):
        return m[0]
    found += 1
    return 'new Blob([' + json.dumps(market, ensure_ascii=False)


html = re.sub(r'new Blob\(\[("(?:[^"\\]|\\.)*")', swap_worker, html)
assert found == 1, 'market worker blob not found exactly once'

# 2. Mount patches (idempotent: each is skipped once applied).
MOUNTS = [
    # Panorama: "O que mudou" first; the primary map lives only in Territórios.
    ("tab==='dashboard'&&jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [\n     jsxRuntime.jsxs('div',{className:'am-overview-summary',",
     "tab==='dashboard'&&jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [\n     jsxRuntime.jsx(OverviewInsights,{model,period:titlePeriod}),\n     jsxRuntime.jsxs('div',{className:'am-overview-summary',"),
    ("useMarketData(overviewMapFilters,['dashboard','geography'].includes(tab)&&mapReady,'primary-map',false)",
     "useMarketData(overviewMapFilters,tab==='geography'&&mapReady,'primary-map',false)"),
    ("['dashboard','geography'].includes(tab)&&mapReady&&jsxRuntime.jsx(PendingChartSnapshot,{pending:overviewMapQuery.pending",
     "tab==='geography'&&mapReady&&jsxRuntime.jsx(PendingChartSnapshot,{pending:overviewMapQuery.pending"),
    # Concorrência: "Mitsubishi no seu segmento" on top.
    ("tab==='competition'&&jsxRuntime.jsxs('div', { className:'am-competition-view', children: [",
     "tab==='competition'&&jsxRuntime.jsxs('div', { className:'am-competition-view', children: [jsxRuntime.jsx(CompetitiveReading,{filters:effectiveFilters,manifest,base:getBase(snapshot)}), "),
    # Territórios: brand maps right after the primary map.
    ("pending:overviewMapQuery.pending,error:overviewMapQuery.error})})",
     "pending:overviewMapQuery.pending,error:overviewMapQuery.error})})\n   , tab==='geography'&&mapReady&&jsxRuntime.jsx(TerritoryBrandMaps,{filters:effectiveFilters,manifest,base:getBase(snapshot)})"),
    # Economia opens on "Contexto econômico".
    ("const scenarioView=SCENARIO_TABS.some(item=>item.value===scenarioSaved.tab)?scenarioSaved.tab:'diagnostic';",
     "const scenarioView=SCENARIO_TABS.some(item=>item.value===scenarioSaved.tab)?scenarioSaved.tab:'context';"),
    # 'interactive-daily' asks the worker for per-day composition (Explorar período · Dia).
    ("const includeInteractive=mode==='interactive';",
     "const includeInteractive=mode==='interactive'||mode==='interactive-daily',includeDaily=mode==='interactive-daily';"),
    ("requestKey=React.useMemo(()=>({includeInteractive,manifest,", "requestKey=React.useMemo(()=>({includeInteractive,includeDaily,manifest,"),
    ("includeCatalog}),[includeInteractive,manifest,", "includeCatalog}),[includeInteractive,includeDaily,manifest,"),
    ("worker.current.postMessage({id,includeInteractive,manifest,", "worker.current.postMessage({id,includeInteractive,includeDaily,manifest,"),
]
MOUNTS_PATH = root / 'scripts' / 'build-mounts.json'
if MOUNTS_PATH.exists():
    MOUNTS += [tuple(m) for m in json.loads(MOUNTS_PATH.read_text())]
for old, new in MOUNTS:
    html = patch(html, old, new)
p.write_text(html)

# 3 and 4.
subprocess.run([sys.executable, str(root / 'scripts/build-page-notes.py')], check=True)
subprocess.run([sys.executable, str(root / 'scripts/build-design-system.py')], check=True)
