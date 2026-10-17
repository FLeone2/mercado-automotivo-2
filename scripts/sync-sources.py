"""Kept for older notes and habits: the build is now scripts/build.py."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).resolve().parent / 'build.py'), run_name='__main__')
