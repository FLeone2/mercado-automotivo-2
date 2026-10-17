#!/usr/bin/env bash
# Runs every automated test: Node (*.cjs) and Python (unittest + script-style tests).
# Python statistical tests need scripts/requirements-scenarios.txt installed.
# Visual checks are separate: node tests/visual/run.cjs (needs a local preview, see README).
cd "$(dirname "$0")/.."
pass=0; fail=0; failed=""
run(){ if timeout 900 "$@" >/tmp/ma-test.log 2>&1; then pass=$((pass+1)); else fail=$((fail+1)); failed="$failed $(basename "${@: -1}")"; fi; }
for t in tests/*.cjs; do run node "$t"; done
for t in tests/test_*.py; do run python3 -m unittest "$t"; done
for t in tests/*.test.py; do run python3 "$t"; done
echo "pass=$pass fail=$fail${failed:+:$failed}"
[ "$fail" -eq 0 ]
