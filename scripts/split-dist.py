"""Move the inline application scripts of dist/index.html into cached files.

The page keeps the same scripts in the same order (classic, blocking), so the
behaviour is identical; each file is named by its content hash and served with
an immutable cache, so a deploy that changes one part refetches only that part.
The JSON data snapshot stays inline because the runtime reads it from the DOM.
Runs from build-dist.sh; the source index.html is never modified.
"""
from pathlib import Path
import hashlib, re

dist = Path(__file__).resolve().parents[1] / 'dist'
page = dist / 'index.html'
html = page.read_text()
out = dist / 'assets' / 'app'
out.mkdir(parents=True, exist_ok=True)
names = iter(['runtime', 'app'])
moved = []


def extract(m):
    body = m.group(1)
    name = next(names, 'script') + '.' + hashlib.sha256(body.encode()).hexdigest()[:12] + '.js'
    (out / name).write_text(body)
    moved.append((name, len(body)))
    return '<script src="assets/app/' + name + '"></script>'


html = re.sub(r'<script>(.*?)</script>', extract, html, flags=re.S)
assert len(moved) == 2, moved
page.write_text(html)
for name, size in moved:
    print('dist/assets/app/' + name, round(size / 1e6, 2), 'MB')
