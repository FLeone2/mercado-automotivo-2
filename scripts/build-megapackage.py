"""Rebuild additive end-of-day features in deterministic order; never publishes."""
import os as _os, sys as _sys
if __name__ == '__main__' and _os.environ.get('MA_LEGACY_BUILD') != '1':
    _sys.exit('Script legado: ele reembute versões antigas de outros módulos. Use python3 scripts/build.py. '
              'Para forçar mesmo assim: MA_LEGACY_BUILD=1 python3 ' + _sys.argv[0])
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[1]
for script in ['build-scenario-refinements.py','build-catalog.py','build-primary-map.py','build-interactive.py','build-animations.py','build-performance.py','build-municipal-fixes.py','build-competition-fixes.py','build-overview-refinements.py','build-shared-layout-refinements.py','build-page-notes.py']:
 subprocess.run([sys.executable,str(root/'scripts'/script)],cwd=root,check=True)
