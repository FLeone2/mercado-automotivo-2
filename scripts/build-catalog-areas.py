"""Turn the hidden "Explorar formatos adicionais" into visible "Mais análises".

- Each area shows only the formats that add something to it, open by default.
- Explorar keeps every format, plus the extra map styles (nothing is lost).
- Panorama, Propulsão, Origem, Territórios and Economia no longer carry the block.
Patches index.html and src/catalog-workspace.js identically, then refreshes CSP.
"""
import os as _os, sys as _sys
if __name__ == '__main__' and _os.environ.get('MA_LEGACY_BUILD') != '1':
    _sys.exit('Script legado: ele reembute versões antigas de outros módulos. Use python3 scripts/build.py. '
              'Para forçar mesmo assim: MA_LEGACY_BUILD=1 python3 ' + _sys.argv[0])
from pathlib import Path
import subprocess, sys

root = Path(__file__).resolve().parents[1]
OLD_AREAS = "const CATALOG_AREAS={dashboard:['treemap','waffle','waterfall'],history:['bump','heatmap','stacked-area'],competition:['bump','slope','dumbbell','diverging','bubble','waterfall','pareto'],ranking:['bump','slope','dumbbell','diverging','bubble','pareto'],segments:['marimekko','treemap','sankey','waffle','stacked-area'],structure:['marimekko','treemap','sankey'],technology:['stacked-area','waffle','heatmap'],origin:['treemap','waffle'],geography:['maps','pareto','dumbbell','diverging'],explore:Object.keys(CATALOG_FORMATS),models:['waterfall','heatmap','dumbbell']};"
NEW_AREAS = "const CATALOG_AREAS={history:['heatmap','bump'],competition:['slope','bubble','waterfall','bump'],ranking:['slope','bump'],segments:['marimekko','sankey'],structure:['marimekko','sankey'],explore:[...Object.keys(CATALOG_FORMATS),'maps']};"
OLD_EXTRAS = "function CatalogExtras(props){const [open,setOpen]=React.useState(false);if(!CATALOG_AREAS[props.tab])return null;return jsxRuntime.jsxs('section',{className:'catalog-extras','aria-label':'Visualizações adicionais',children:[jsxRuntime.jsxs('button',{type:'button',className:'catalog-toggle','aria-expanded':open,onClick:()=>setOpen(v=>!v),children:[jsxRuntime.jsx('span',{children:open?'−':'＋'}),' Explorar formatos adicionais',jsxRuntime.jsx('small',{children:'Gráficos e mapas complementares'})]}),open&&jsxRuntime.jsx(CatalogLive,props)]});}"
NEW_EXTRAS = ("function CatalogExtras(props){if(!CATALOG_AREAS[props.tab])return null;const explore=props.tab==='explore';"
              "return jsxRuntime.jsxs('section',{className:'catalog-extras is-open','aria-labelledby':'catalog-extras-'+props.tab,children:["
              "jsxRuntime.jsxs('div',{className:'catalog-extras-head',children:[jsxRuntime.jsx('h2',{id:'catalog-extras-'+props.tab,children:explore?'Todos os formatos':'Mais análises'}),"
              "jsxRuntime.jsx('p',{children:explore?'Todos os gráficos e estilos de mapa do painel, com os filtros acima.':'Outras formas de ver esta área. Todos os formatos ficam em Explorar.'})]}),"
              "jsxRuntime.jsx(CatalogLive,props)]});}")
CSS = """
/* Mais análises: visible, titled block instead of a collapsed toggle. */
.catalog-extras.is-open{margin-top:24px;display:flex;flex-direction:column;gap:12px}
.catalog-extras-head h2{margin:0;font-size:clamp(18px,1.6vw,21px);font-weight:650;letter-spacing:-.01em}
.catalog-extras-head p{margin:2px 0 0;font-size:13px;color:var(--secondary)}
"""
PREV_AREAS = "const CATALOG_AREAS={history:['heatmap','bump'],competition:['bump','slope','bubble','waterfall'],ranking:['bump','slope'],segments:['marimekko','sankey'],structure:['marimekko','sankey'],explore:[...Object.keys(CATALOG_FORMATS),'maps']};"
for rel in ['index.html', 'src/catalog-workspace.js']:
    p = root / rel
    text = p.read_text().replace(PREV_AREAS, NEW_AREAS)
    for old, new in [(OLD_AREAS, NEW_AREAS), (OLD_EXTRAS, NEW_EXTRAS)]:
        if new not in text:
            assert text.count(old) == 1, (rel, old[:50])
            text = text.replace(old, new)
    p.write_text(text)
css = root / 'src/design-system.css'
if 'Mais análises: visible' not in css.read_text():
    css.write_text(css.read_text().rstrip('\n') + '\n' + CSS)
subprocess.run([sys.executable, str(root / 'scripts/build-design-system.py')], check=True)
