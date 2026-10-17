"""Embed the single theme registry and the design-system layer, then refresh CSP hashes.

- Replaces the old 14-theme catalog (and the blue theme push) with src/theme-registry.js.
- Patches two runtime spots so removed theme ids can never crash the app:
  an unknown stored theme falls back to the default, and chart image export
  falls back to Petróleo instead of the removed `codex-classic` entry.
- Drops the obsolete theme stylesheets and keeps src/design-system.css as the
  last stylesheet in <head>, so it wins over every older layer.
Run after any other build-*.py script.
"""
from pathlib import Path
import base64, hashlib, re, subprocess, tempfile

root = Path(__file__).resolve().parents[1]
p = root / 'index.html'
html = p.read_text()

# 1. Theme registry (old catalog/blue blocks on first run, own markers afterwards).
html = re.sub(r'/\* BEGIN MARKET BLUE THEME \*/.*?/\* END MARKET BLUE THEME \*/', '', html, flags=re.S)
block = ('/* BEGIN THEME REGISTRY */\n' + (root / 'src/brand-colors.js').read_text() + '\n' + (root / 'src/theme-registry.js').read_text()
         + '\ninstallThemeRegistry(T5,C5);\n/* END THEME REGISTRY */')
for start, end in [('/* BEGIN CATALOG THEMES */', '/* END CATALOG THEMES */'),
                   ('/* BEGIN THEME REGISTRY */', '/* END THEME REGISTRY */')]:
    if start in html:
        html = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: block, html, count=1, flags=re.S)
        break
else:
    raise SystemExit('theme registry insertion point not found')

def old_prefix_of(text, other_old):
    return other_old in text


# 2. Runtime safety patches (idempotent).
patches = [
    ('if(!n)throw Error(`Unknown Data app theme: ${e}`);', 'if(!n)n=T5[0];'),
    ('??T5.find(e=>e.id===`codex-classic`),t)', '??T5.find(e=>e.id===`petroleo`),t)'),
    # Chart colors: the runtime rotated the hue of --chart-1 in 15° steps, which
    # produced arbitrary oranges and greens. Cycle the validated palette instead.
    ('rL=Array.from({length:nL.length},(e,t)=>`oklch(from var(--chart-1) l max(c, 0.16) calc(h + ${nL[t]*15}))`)',
     'rL=Array.from({length:nL.length},(e,t)=>tL[t%tL.length])'),
    # Measures take palette slots in order (a single-measure chart is slot 1), not by name hash.
    ('let t=tL.indexOf(aL({field:e}));if(n.size<rL.length)',
     'let t=/count|volume|emplac|registr|total|value|valor/iu.test(e)?0:1;if(n.size<rL.length)'),
    # The main volume measure is always slot 1, whatever other measures share its queries.
    ('function iL(e=``){let t=String(e)',
     'function iL(e=``){if(/^(?:count|total|volume|registrations)$/iu.test(String(e)))return tL[0];let t=String(e)'),
    # Brand identity colors win over every hashed assignment, whatever the chart or dimension.
    ('function iL(e=``){if(/^(?:count|total|volume|registrations)$/iu.test(String(e)))return tL[0];',
     'function iL(e=``){if(brandColorKnown(e))return brandColor(e);if(/^(?:count|total|volume|registrations)$/iu.test(String(e)))return tL[0];'),
    # Brands keep fixed colors everywhere: Fiat, VW and BYD own slots 1-3; other brands hash into 4-8.
    ('function aL({field:e,dimension:t,value:n,index:r=0,explicitColor:i}={}){if(typeof i==`string`&&i.trim())return i;',
     'function aL({field:e,dimension:t,value:n,index:r=0,explicitColor:i}={}){if(typeof i==`string`&&i.trim())return i;'
     'let dsD=String(t??e??``).toLowerCase(),dsV=String(n??``).toUpperCase();if(n!=null&&/marca|brand/u.test(dsD)){let dsB={FIAT:0,VW:1,VOLKSWAGEN:1,BYD:2}[dsV];if(dsB!=null)return tL[dsB];let dsH=0;for(let c of dsV)dsH=Math.imul(31,dsH)+c.codePointAt(0)|0;return tL[3+(dsH>>>0)%(tL.length-3)]}'),
]
# Patches may build on each other (a later one rewrites the text of an earlier one),
# so apply them all first and only then check the final state of each chain.
FINAL = {}
for old, new in patches:
    FINAL[old] = new
    if new not in html and old in html:
        assert html.count(old) == 1, 'ambiguous runtime patch: ' + old[:60]
        html = html.replace(old, new)
for old, new in patches:
    superseded = any(o2 != old and old_prefix_of(new, o2) for o2, _ in patches)
    assert new in html or superseded, 'runtime patch missing: ' + new[:60]

# 3. Stylesheets: obsolete theme layers out, design system last.
for sid in ['market-blue-theme-styles', 'catalog-themes-styles', 'design-system-styles']:
    html = re.sub(r'<style id="' + sid + r'">.*?</style>\n?', '', html, flags=re.S)
css = '<style id="design-system-styles">\n' + (root / 'src/design-system.css').read_text() + '\n</style>\n'
assert html.count('</head>') == 1
html = html.replace('</head>', css + '</head>')
p.write_text(html)

# 4. Exact CSP hashes for the two executable inline scripts.
scripts = [m[1] for m in re.finditer(r'<script>(.*?)</script>', html, re.S)]
assert len(scripts) == 2
hashes = ' '.join("'sha256-" + base64.b64encode(hashlib.sha256(s.encode()).digest()).decode() + "'" for s in scripts)
h = root / '_headers'
h.write_text(re.sub(r"script-src 'self' .*? blob:;", "script-src 'self' " + hashes + " blob:;", h.read_text()))
for s in scripts:
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js') as f:
        f.write(s); f.flush()
        subprocess.run(['node', '--check', f.name], check=True)
print('Theme registry and design system embedded; scripts parse; CSP hashes refreshed.')
